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
    * @param {UserEvent} event
    */
    private onUserRemoved( event: UsersInterface.SocketTokens.IUserToken ) {
        this.removeByUser( event.username );
    }

    /**
    * Removes projects by a given query
    * @param {any} selector
    * @returns {Promise<IRemoveResponse>}
    */
    removeByQuery( selector: any ): Promise<modepress.IRemoveResponse> {
        const toRet: modepress.IRemoveResponse = { error: false, message: '0 items have been removed', itemsRemoved: [] };
        const model = this.getModel( 'en-projects' );
        const buildCtrl = BuildController.singleton;
        let numRemoved = 0;

        return new Promise<modepress.IRemoveResponse>( function( resolve, reject ) {
            model.findInstances<HatcheryServer.IProject>( selector ).then( function( instances ) {
                if ( instances.length === 0 )
                    return resolve( toRet );

                instances.forEach( function( val, index ) {
                    buildCtrl.removeByProject( val._id, val.dbEntry.user ).then( function( numDeleted ) {
                        return model.deleteInstances( <HatcheryServer.IProject>{ _id: val._id });

                    }).then( function( numDeleted ) {
                        numRemoved++;
                        toRet.itemsRemoved.push( { id: val._id, error: false, errorMsg: '' });
                        if ( index === instances.length - 1 ) {
                            toRet.message = `${numRemoved} items have been removed`;
                            return resolve( toRet );
                        }

                    }).catch( function( err: Error ) {
                        toRet.itemsRemoved.push( { id: val._id, error: true, errorMsg: err.message });
                        toRet.error = true;
                        toRet.message = `An error occurred when deleting project ${val._id}`
                        winston.error( toRet.message + ' : ' + err.message, { process: process.pid });
                    });
                });

            }).catch( function( err: Error ) {
                toRet.error = true;
                toRet.message = `An error occurred when deleting projects by query : ${err.message}`
                winston.error( toRet.message, { process: process.pid });
                return resolve( toRet );
            });
        });
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
    private updateProject( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-projects' );
        const that = this;
        const project: string = req.params.project;
        const updateToken: HatcheryServer.IProject = {};
        const token: HatcheryServer.IProject = req.body;

        // Verify the project ID
        if ( !modepress.isValidID( project ) )
            return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: 'Please use a valid project ID' }) );

        updateToken._id = new mongodb.ObjectID( project );
        updateToken.user = req._user.username;

        model.update( updateToken, token ).then( function( instance ) {
            if ( instance.error ) {
                winston.error( <string>instance.tokens[ 0 ].error, { process: process.pid });
                return res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: <string>instance.tokens[ 0 ].error
                }) );
            }

            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: `[${instance.tokens.length}] Projects updated`
            }) );

        }).catch( function( error: Error ) {
            winston.error( error.message, { process: process.pid });
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }) );
        });
    }

    /**
    * Removes all projects by ID
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    remove( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        const that = this;
        const target = req.params.user;
        const projectIds = req.params.projects.split( ',' );
        const validityPromises: Array<Promise<boolean>> = [];

        req._suppressNext = true;

        for ( let i = 0, l = projectIds.length; i < l; i++ ) {
            req.params.project = projectIds[ i ];
            validityPromises.push( PermissionController.singleton.canAdminProject( req, res, next ) );
        }

        // Check all the validity promises. If any one of them is false, then there is something wrong.
        Promise.all( validityPromises ).then( function( validityArray ) {

            for ( let i = 0, l = validityArray.length; i < l; i++ )
                if ( !validityArray[ i ] )
                    return null;

            return that.removeByIds( projectIds, target );

        }).then( function( response ) {
            // No response - this means it was handled in the validity checks
            if ( !response )
                return;

            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IRemoveResponse>response ) );

        }).catch( function( error: Error ) {
            winston.error( error.message, { process: process.pid });
            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }) );
        });
    }

    /**
    * Gets projects based on the format of the request
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    createProject( req: modepress.IAuthReq, res: express.Response, next: Function ) {
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
        let newBuild: Modepress.ModelInstance<HatcheryServer.IBuild>;
        let newProject: Modepress.ModelInstance<HatcheryServer.IProject>;
        const that = this;

        // User is passed from the authentication function
        token.user = req._user.username;
        token.adminPrivileges = [ req._user.username ];
        token.readPrivileges = [];
        token.writePrivileges = [];

        // Create build
        buildCtrl.createBuild( req._user.username ).then( function( build ) {
            newBuild = build;
            token.build = newBuild._id;
            return projects.createInstance( token );

        }).then( function( project ) {
            newProject = project;

            // Link build with new project
            return buildCtrl.linkProject( newBuild._id, newProject._id );

        }).then( function() {
            // Make sure we're still in the limit
            PermissionController.singleton.projectsWithinLimits( req._user ).then( function() {
                return newProject.schema.getAsJson( newProject._id, { verbose: true });

            }).then( function( json ) {

                // Finished
                res.end( JSON.stringify( <ModepressAddons.ICreateProject>{
                    error: false,
                    message: `Created project '${token.name}'`,
                    data: json
                }) );

            }).catch( function( err: Error ) {
                // Not in the limit - so remove the project and tell the user to upgrade
                that.removeByIds( [ newProject._id ], req._user.username );
                res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );
            });

        }).catch( function( err: Error ) {
            winston.error( err.message, { process: process.pid });

            // Make sure any builds were removed if an error occurred
            if ( newBuild ) {
                buildCtrl.removeByIds( [ newBuild._id.toString() ], req._user.username ).then( function() {
                    res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );

                }).catch( function( err: Error ) {
                    winston.error( err.message, { process: process.pid });
                    res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );
                });
            }
            else
                res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: err.message }) );
        });
    }

    getByQuery( query: any, req: modepress.IAuthReq, res: express.Response ) {
        const model = this.getModel( 'en-projects' );
        const that = this;
        let count = 0;

        // First get the count
        model.count( query ).then( function( num ) {
            count = num;
            return model.findInstances<HatcheryServer.IProject>( query, [], parseInt( req.query.index ), parseInt( req.query.limit ) );

        }).then( function( instances ) {
            const sanitizedData = [];
            for ( let i = 0, l = instances.length; i < l; i++ )
                sanitizedData.push( instances[ i ].schema.getAsJson( instances[ i ]._id, { verbose: req._verbose }) );

            return Promise.all( sanitizedData );

        }).then( function( sanitizedData ) {

            res.end( JSON.stringify( <ModepressAddons.IGetProjects>{
                error: false,
                count: count,
                message: `Found ${count} projects`,
                data: sanitizedData
            }) );

        }).catch( function( error: Error ) {
            winston.error( error.message, { process: process.pid });
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }) );
        });
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