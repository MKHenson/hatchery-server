import * as mongodb from 'mongodb';
import * as express from 'express';
import * as modepress from 'modepress-api';
import { BuildModel } from '../models/build-model';
import * as winston from 'winston';
import { EngineController } from './engine-controller';

/**
* A controller that deals with build models
*/
export class BuildController extends EngineController {
    public static singleton: BuildController;

	/**
	* Creates a new instance of the  controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor( server: modepress.IServer, config: modepress.IConfig, e: express.Express ) {
        super( [ modepress.Model.registerModel( BuildModel ) ], server, config, e );
        BuildController.singleton = this;

        // Define the routes
        this.router.get( '/users/:user/projects/:project/builds/:id?', <any>[ modepress.canEdit, this.getBuilds.bind( this ) ] );
        this.router.post( '/users/:user/projects/:project/builds', <any>[ modepress.canEdit, this.create.bind( this ) ] );
        this.router.put( '/users/:user/projects/:project/builds/:id', <any>[ modepress.canEdit, this.edit.bind( this ) ] );
    }

    /**
    * Gets all builds associated with a particular user & project
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    async getBuilds( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const target = req.params.user;
        const project = req.params.project;
        const model = this.getModel( 'en-builds' );

        if ( !modepress.isValidID( project ) )
            return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: `Please use a valid project ID` }) );

        const findToken: HatcheryServer.IBuild = { user: target, projectId: new mongodb.ObjectID( project ) };

        if ( req.params.id && modepress.isValidID( req.params.id ) )
            findToken._id = new mongodb.ObjectID( req.params.id );

        try {
            const total = await model.count( findToken );
            const instances = await model.findInstances<HatcheryServer.IBuild>( findToken, [], parseInt( req.query.index ), parseInt( req.query.limit ) );

            const sanitizedData: Promise<any>[] = [];
            for ( let i = 0, l = instances.length; i < l; i++ )
                sanitizedData.push( instances[ i ].schema.getAsJson( instances[ i ]._id, { verbose: Boolean( req.query.verbose ) }) );

            const results = await Promise.all( sanitizedData );
            return res.end( JSON.stringify( <ModepressAddons.IGetBuilds>{
                error: false,
                message: `Found [${total}] builds for user '${target}'`,
                count: total,
                data: results
            }) );
        }
        catch ( err ) {
            winston.error( err.message, { process: process.pid });
            return res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: `Could not get builds for '${target}' : ${err.message}`
            }) );
        }
    }

    /**
    * Creates a new build
    * @returns {Promise<Modepress.ModelInstance<HatcheryServer.IBuild>>}
    */
    async createBuild( username: string, project?: mongodb.ObjectID ): Promise<Modepress.ModelInstance<HatcheryServer.IBuild>> {
        const model = this.getModel( 'en-builds' );
        const instance = await model.createInstance( <HatcheryServer.IBuild>{ name: '', user: username, projectId: project });
        return instance;
    }

    /**
    * Removes a build by its id
    * @param {Array<string>} ids
    * @param {string} user The username of the user
    * @returns {Promise<number>}
    */
    async removeByIds( ids: Array<string>, user: string ): Promise<number> {
        const model = this.getModel( 'en-builds' );

        const findToken: HatcheryServer.IBuild = { user: user };
        const $or: Array<HatcheryServer.IBuild> = [];
        for ( let i = 0, l = ids.length; i < l; i++ )
            $or.push( { _id: new mongodb.ObjectID( ids[ i ] ) });

        if ( $or.length > 0 )
            findToken[ '$or' ] = $or;

        const numDeleted = await model.deleteInstances( findToken );
        return numDeleted;
    }

    /**
    * Removes a build by its user
    * @param {string} user The username of the user
    * @returns {Promise<number>}
    */
    async removeByUser( user: string ): Promise<number> {
        const model = this.getModel( 'en-builds' );
        const instance = await model.deleteInstances( <HatcheryServer.IBuild>{ user: user });
        return instance;
    }

    /**
    * Removes a build by its project ID
    * @param {ObjectID} project The id of the project
    * @param {string} user The username of the user
    * @returns {Promise<number>}
    */
    async removeByProject( project: mongodb.ObjectID, user: string ): Promise<number> {
        const model = this.getModel( 'en-builds' );
        const instance = await model.deleteInstances( <HatcheryServer.IBuild>{ projectId: project, user: user });
        return instance;
    }

    /**
    * Removes a build by its id
    * @returns {Promise<any>}
    */
    async linkProject( buildId: string, projId: string ) {
        const model = this.getModel( 'en-builds' );
        const instances = await model.update( <HatcheryServer.IBuild>{ _id: new mongodb.ObjectID( buildId ) }, <HatcheryServer.IBuild>{ projectId: new mongodb.ObjectID( projId ) });

        if ( instances.error )
            throw new Error( 'An error has occurred while linking the build with a project' );

        return instances;
    }

    /**
    * Attempts to update a build's data
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected async edit( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-builds' );
        const project: string = req.params.project;
        const id: string = req.params.id;
        const search: HatcheryServer.IBuild = {};
        const token: HatcheryServer.IBuild = req.body;

        // Verify the resource ID
        if ( !modepress.isValidID( id ) )
            return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: 'Please use a valid resource ID' }) );

        // Verify the project ID
        if ( !modepress.isValidID( project ) )
            return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: 'Please use a valid project ID' }) );

        search._id = new mongodb.ObjectID( id );
        search.projectId = new mongodb.ObjectID( project );
        try {
            const instance = await model.update( search, token );

            if ( instance.error )
                throw new Error( <string>instance.tokens[ 0 ].error );

            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: `[${instance.tokens.length}] Build updated`
            }) );
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
    * Creates a new build for a user in a specific project.
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    async create( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const target = req.params.user;
        const project = req.params.project;
        const model = this.getModel( 'en-builds' );
        const setAsCurrent = ( req.query[ 'set-current' ] ? true : false );

        if ( !modepress.isValidID( project ) )
            return res.end( JSON.stringify( <ModepressAddons.IGetBuilds>{ error: true, message: `Please use a valid project ID` }) );

        try {
            const instance = await this.createBuild( target, new mongodb.ObjectID( project ) );

            if ( setAsCurrent ) {
                const projectModel = this.getModel( 'en-projects' )
                const token = await projectModel.update<HatcheryServer.IProject>( <HatcheryServer.IProject>{ _id: new mongodb.ObjectID( project ) }, { build: instance._id });
                if ( token.error )
                    throw new Error( <string>token.tokens[ 0 ].error );
            }

            const sanitizedData = await instance.schema.getAsJson<HatcheryServer.IBuild>( instance._id, { verbose: true });

            return res.end( JSON.stringify( <ModepressAddons.IGetBuilds>{
                error: false,
                message: `Created new build for user '${target}'`,
                count: 1,
                data: sanitizedData
            }) );
        }
        catch ( err ) {
            winston.error( err.message, { process: process.pid });
            return res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: `Could not create build for '${target}' : ${err.message}`
            }) );
        }
    }
}