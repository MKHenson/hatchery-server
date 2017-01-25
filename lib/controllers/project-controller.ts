import * as mongodb from 'mongodb';
import * as express from 'express';
import * as modepress from 'modepress-api';
import { PermissionController } from './permission-controller';
import { BuildController } from './build-controller';
import { ProjectModel } from '../models/project-model';
import * as winston from 'winston';
import { EngineController } from './engine-controller';

/**
* A controller that deals with project models
*/
export class ProjectController extends EngineController {
	/**
	* Creates a new instance of the controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor( server: modepress.IServer, config: modepress.IConfig, e: express.Express ) {
        super( [ modepress.Model.registerModel( ProjectModel ) ], server, config, e );

        // Get the project privilege controllers
        const canRead = PermissionController.singleton.canReadProject.bind( PermissionController.singleton );
        const canAdmin = PermissionController.singleton.canAdminProject.bind( PermissionController.singleton );

        this.router.get( '/projects', <any>[ modepress.isAdmin, this.getAllProjects.bind( this ) ] );
        this.router.post( '/projects', <any>[ modepress.isAuthenticated, this.createProject.bind( this ) ] );
        this.router.get( '/users/:user/projects', <any>[ modepress.getUser, this.getProjects.bind( this ) ] );
        this.router.get( '/users/:user/projects/:project', <any>[ modepress.getUser, canRead, this.getProject.bind( this ) ] );
        this.router.put( '/users/:user/projects/:project', <any>[ modepress.canEdit, canAdmin, this.updateProject.bind( this ) ] );
        this.router.delete( '/users/:user/projects/:projects', <any>[ modepress.canEdit, this.remove.bind( this ) ] );

        let userRemoved: UsersInterface.SocketTokens.ClientInstructionType = 'Removed';
        modepress.EventManager.singleton.on( userRemoved, this.onUserRemoved.bind( this ) );
    }

    /**
    * Called whenever a user has had their account removed
    * @param {UsersInterface.SocketTokens.IUserToken} token
    */
    private onUserRemoved( event: UsersInterface.SocketTokens.IUserToken ) {
        this.removeByUser( event.username );
    }

    /**
    * Removes projects by a given query
    * @param {any} selector
    * @returns {Promise<IRemoveResponse>}
    */
    async removeByQuery( selector: any ): Promise<modepress.IRemoveResponse> {
        const toRet: modepress.IRemoveResponse = { error: false, message: '0 items have been removed', itemsRemoved: [] };
        const model = this.getModel( 'en-projects' );
        const buildCtrl = BuildController.singleton;
        let numRemoved = 0;
        let instances: modepress.ModelInstance<HatcheryServer.IProject>[];

        try {
            instances = await model.findInstances<HatcheryServer.IProject>( selector );
            if ( instances.length === 0 )
                return toRet;
        }
        catch ( err ) {
            toRet.error = true;
            toRet.message = `An error occurred when deleting projects by query : ${err.message}`
            winston.error( toRet.message, { process: process.pid });
            return toRet;
        }

        for ( let i = 0, l = instances.length; i < l; i++ ) {
            const project = instances[i];
            try {
                let numDeleted = await buildCtrl.removeByProject( project._id, project.dbEntry.user! );
                numDeleted = await model.deleteInstances( <HatcheryServer.IProject>{ _id: project._id });

                numRemoved++;
                toRet.itemsRemoved.push( { id: project._id, error: false, errorMsg: '' });
                if ( i === instances.length - 1 ) {
                    toRet.message = `${numRemoved} items have been removed`;
                }
            }
            catch ( err ) {
                toRet.itemsRemoved.push( { id: project._id, error: true, errorMsg: err.message });
                toRet.error = true;
                toRet.message = `An error occurred when deleting project ${project._id}`
                winston.error( toRet.message + ' : ' + err.message, { process: process.pid });
            }
        }

        return toRet;
    }

    /**
    * Removes a project by user
    * @param {string} user
    * @returns {Promise<IRemoveResponse>}
    */
    removeByUser( user: string ): Promise<modepress.IRemoveResponse> {
        return this.removeByQuery( <HatcheryServer.IProject>{ user: user });
    }

    /**
    * Removes a project by its id
    * @param {Array<string>} ids
    * @returns {Promise<IRemoveResponse>}
    */
    removeByIds( ids: Array<string>, user: string ): Promise<modepress.IRemoveResponse> {
        const findToken: HatcheryServer.IProject = { user: user };
        const $or: Array<HatcheryServer.IProject> = [];

        for ( let i = 0, l = ids.length; i < l; i++ )
            $or.push( { _id: new mongodb.ObjectID( ids[ i ] ) });

        if ( $or.length > 0 )
            findToken[ '$or' ] = $or;

        return this.removeByQuery( findToken );
    }

    /**
    * Attempts to update a project
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private async updateProject( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-projects' );
        const project: string = req.params.project;
        const updateToken: HatcheryServer.IProject = {};
        const token: HatcheryServer.IProject = req.body;

        // Verify the project ID
        if ( !modepress.isValidID( project ) )
            return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: 'Please use a valid project ID' }) );

        updateToken._id = new mongodb.ObjectID( project );
        updateToken.user = req._user!.username;

        try {
            const instance = await model.update( updateToken, token );

            if ( instance.error )
                throw new Error(<string>instance.tokens[ 0 ].error);

            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: `[${instance.tokens.length}] Projects updated`
            }));
        }
        catch ( error ) {
            winston.error( error.message, { process: process.pid });
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }) );
        }
    }

    /**
    * Removes all projects by ID
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    async remove( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        const target = req.params.user;
        const projectIds = req.params.projects.split( ',' );
        const validityPromises: Array<Promise<boolean>> = [];

        req._suppressNext = true;

        for ( let i = 0, l = projectIds.length; i < l; i++ ) {
            req.params.project = projectIds[ i ];
            validityPromises.push( PermissionController.singleton.canAdminProject( req, res, next ) );
        }

        try {
            // Check all the validity promises. If any one of them is false, then there is something wrong.
            const validityArray = await Promise.all( validityPromises );

            for ( let i = 0, l = validityArray.length; i < l; i++ )
                if ( !validityArray[ i ] )
                    return null;

            const response = await this.removeByIds( projectIds, target );

            // No response - this means it was handled in the validity checks
            if ( !response )
                return;

            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IRemoveResponse>response ) );
        }
        catch ( error ) {
            winston.error( error.message, { process: process.pid });
            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }) );
        }
    }

    /**
    * Gets projects based on the format of the request
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    async createProject( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        // ✔ Check logged in + has rights to do request
        // ✔ Create a build
        // ✔ Sanitize details
        // ✔ Create a project
        // ✔ Associate build with project and vice-versa
        // ✔ Check if project limit was reached - if over then remove project

        res.setHeader( 'Content-Type', 'application/json' );
        const token: HatcheryServer.IProject = req.body;
        const projects = this.getModel( 'en-projects' );
        const buildCtrl = BuildController.singleton;
        let newBuild: Modepress.ModelInstance<HatcheryServer.IBuild> | null = null;
        let newProject: Modepress.ModelInstance<HatcheryServer.IProject>;

        // User is passed from the authentication function
        token.user = req._user!.username;
        token.adminPrivileges = [ req._user!.username! ];
        token.readPrivileges = [];
        token.writePrivileges = [];

        try {
            // Create build
            newBuild = await buildCtrl.createBuild( req._user!.username! );
            token.build = newBuild._id;
            newProject = await projects.createInstance( token );

            // Link build with new project
            await buildCtrl.linkProject( newBuild._id, newProject._id );

            try {
                // Make sure we're still in the limit
                await PermissionController.singleton.projectsWithinLimits( req._user! );
                const json = await newProject.schema.getAsJson( newProject._id, { verbose: true });

                // Finished
                res.end( JSON.stringify( <ModepressAddons.ICreateProject>{
                    error: false,
                    message: `Created project '${token.name}'`,
                    data: json
                }));
            }
            catch ( err ) {
                // Not in the limit - so remove the project and tell the user to upgrade
                this.removeByIds( [ newProject._id ], req._user!.username! );
                res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );
            }
        }
        catch ( err ) {
            winston.error( err.message, { process: process.pid });

            // Make sure any builds were removed if an error occurred
            if ( newBuild ) {
                buildCtrl.removeByIds( [ newBuild!._id.toString() ], req._user!.username! ).then( function() {
                    res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );

                }).catch( function( err: Error ) {
                    winston.error( err.message, { process: process.pid });
                    res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );
                });
            }
            else
                res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );
        }
    }

    async getByQuery( query: any, req: modepress.IAuthReq, res: express.Response ) {
        const model = this.getModel( 'en-projects' );

        try {
            // First get the count
            const count = await model.count( query );
            const instances = await model.findInstances<HatcheryServer.IProject>( query, [], parseInt( req.query.index ), parseInt( req.query.limit ) );


            const sanitizedData: Promise<any>[] = [];
            for ( let i = 0, l = instances.length; i < l; i++ )
                sanitizedData.push( instances[ i ].schema.getAsJson( instances[ i ]._id, { verbose: req._verbose }) );

            const jsonArray = await Promise.all( sanitizedData );

            if (query._id) {
                res.end( JSON.stringify( <ModepressAddons.IGetProject>{
                    error: false,
                    message: jsonArray.length > 0 ? `Found project '${query._id}'` : 'No project found',
                    data: jsonArray.length > 0 ? jsonArray[0] : undefined
                }) );
            }
            else {
                res.end( JSON.stringify( <ModepressAddons.IGetProjects>{
                    error: false,
                    count: count,
                    message: `Found ${count} projects`,
                    data: jsonArray
                }) );
            }
        }
        catch ( error ) {
            winston.error( error.message, { process: process.pid });
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }) );
        }
    }

    /**
   * Gets all projects. Request only valid for admin's
   * @param {IAuthReq} req
   * @param {express.Response} res
   * @param {Function} next
   */
    getAllProjects( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        this.getByQuery( {}, req, res );
    }

    /**
    * Gets projects based on the format of the request. You can optionally pass a 'search', 'index' and 'limit' query parameter.
    * @param {IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    */
    getProjects( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const findToken: HatcheryServer.IProject = {};
        findToken.user = req.params.user;

        // Check for keywords
        if ( req.query.search )
            findToken.name = <any>new RegExp( req.query.search, 'i' );

        this.getByQuery( findToken, req, res );
    }

    /**
    * Gets projects based on the format of the request. You can optionally pass a 'search', 'index' and 'limit' query parameter.
    * @param {IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    */
    getProject( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const findToken: HatcheryServer.IProject = {};
        findToken.user = req.params.user;

        // Check for valid ID
        if ( req.params.project )
            if ( modepress.isValidID( req.params.project ) )
                findToken._id = new mongodb.ObjectID( req.params.project );
            else
                return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: 'Please use a valid object id' }) );

        this.getByQuery( findToken, req, res );
    }
}