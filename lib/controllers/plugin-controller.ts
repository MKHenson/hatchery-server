import * as mongodb from 'mongodb';
import * as express from 'express';
import * as modepress from 'modepress-api';
import { PluginModel } from '../models/plugin-model';
import * as winston from 'winston';
import { EngineController } from './engine-controller';

/**
* A controller that deals with plugin models
*/
export class PluginController extends EngineController {
	/**
	* Creates a new instance of the controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor( server: modepress.IServer, config: modepress.IConfig, e: express.Express ) {
        super( [ modepress.Model.registerModel( PluginModel ) ], server, config, e );

        this.router.get( '/plugins/:id?', <any>[ modepress.getUser, this.getPlugins.bind( this ) ] );
        this.router.delete( '/plugins/:id', <any>[ modepress.isAdmin, this.remove.bind( this ) ] );
        this.router.post( '/plugins', <any>[ modepress.isAdmin, this.create.bind( this ) ] );
        this.router.put( '/plugins/:id', <any>[ modepress.isAdmin, this.update.bind( this ) ] );
    }

    /**
    * Attempts to remove a plugin by ID
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private async remove( req: express.Request, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const plugins = this.getModel( 'en-plugins' );

        try {
            const numRemoved = await plugins.deleteInstances( <HatcheryServer.IPlugin>{ _id: new mongodb.ObjectID( req.params.id ) });
            if ( numRemoved === 0 )
                throw new Error( 'Could not find a plugin with that ID' );

            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: 'Plugin has been successfully removed'
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
    * Updates a plugin with new details
    * @param {IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private async update( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-plugins' );
        const pluginToken = <HatcheryServer.IPlugin>req.body;

        try {
            const data = await model.update<HatcheryServer.IPlugin>( <HatcheryServer.IPlugin>{ _id: new mongodb.ObjectID( req.params.id ) }, pluginToken );
            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: 'Plugin Updated'
            }) );
        }
        catch ( error ) {
            winston.error( error.message, { process: process.pid });
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: error.message
            }));
        }
    }

    /**
    * Gets plugins based on the format of the request
    * @param {IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private async create( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-plugins' );
        const pluginToken = <HatcheryServer.IPlugin>req.body;

        pluginToken.author = req._user!.username;

        try {
            // Create the new plugin
            const instance = await model.createInstance<ModepressAddons.ICreatePlugin>( pluginToken );
            const json = await instance.schema.getAsJson( instance._id, { verbose: true });

            res.end( JSON.stringify( <ModepressAddons.ICreatePlugin>{
                error: false,
                message: `Created new plugin '${pluginToken.name}'`,
                data: json
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
    * Gets plugins based on the format of the request
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private async getPlugins( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-plugins' );

        const findToken: HatcheryServer.IPlugin = {};

        if ( !req._isAdmin )
            findToken.isPublic = true;

        let getContent: boolean = true;
        if ( req.query.minimal )
            getContent = false;

        if ( req.params.id ) {
            if ( !modepress.isValidID( req.params.id ) )
                return res.end( JSON.stringify( <modepress.IResponse>{ error: true, message: 'Please use a valid object ID' }) );

            findToken._id = new mongodb.ObjectID( req.params.id );
        }

        // Check for keywords
        if ( req.query.search )
            ( <HatcheryServer.IPlugin>findToken ).name = <any>new RegExp( req.query.search, 'i' );

        try {
            // First get the count
            const count = await model.count( findToken );
            const instances = await model.findInstances<HatcheryServer.IPlugin>( findToken, [], parseInt( req.query.index ), parseInt( req.query.limit ), ( getContent === false ? { html: 0 } : undefined ) );

            const sanitizedData: Promise<any>[] = [];
            for ( let i = 0, l = instances.length; i < l; i++ )
                sanitizedData.push( instances[ i ].schema.getAsJson( instances[ i ]._id, { verbose: true }) );

            const pluginJsons = await Promise.all( sanitizedData );

            if ( findToken._id ) {
                res.end( JSON.stringify( <ModepressAddons.IGetPlugin>{
                    error: false,
                    message: pluginJsons.length > 0 ? `Found plugin` : `No plugin found`,
                    data: pluginJsons.length > 0 ? pluginJsons[0] : undefined
                }) );
            }
            else {
                res.end( JSON.stringify( <ModepressAddons.IGetPlugins>{
                    error: false,
                    count: count,
                    message: `Found ${count} plugins`,
                    data: pluginJsons
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
}