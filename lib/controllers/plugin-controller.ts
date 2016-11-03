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
    private remove( req: express.Request, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const plugins = this.getModel( 'en-plugins' );

        plugins.deleteInstances( <HatcheryServer.IPlugin>{ _id: new mongodb.ObjectID( req.params.id ) }).then( function( numRemoved ) {
            if ( numRemoved === 0 )
                return Promise.reject( new Error( 'Could not find a plugin with that ID' ) );

            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: 'Plugin has been successfully removed'
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
    * Updates a plugin with new details
    * @param {IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private update( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-plugins' );
        const that = this;
        const pluginToken = <HatcheryServer.IPlugin>req.body;
        model.update<HatcheryServer.IPlugin>( <HatcheryServer.IPlugin>{ _id: new mongodb.ObjectID( req.params.id ) }, pluginToken ).then( function( data ) {
            res.end( JSON.stringify( <modepress.IResponse>{
                error: false,
                message: 'Plugin Updated'
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
    * Gets plugins based on the format of the request
    * @param {IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private create( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-plugins' );
        const that = this;
        const pluginToken = <HatcheryServer.IPlugin>req.body;

        pluginToken.author = req._user.username;

        // Create the new plugin
        model.createInstance<ModepressAddons.ICreatePlugin>( pluginToken ).then( function( instance ) {
            return instance.schema.getAsJson( instance._id, { verbose: true });

        }).then( function( json ) {

            res.end( JSON.stringify( <ModepressAddons.ICreatePlugin>{
                error: false,
                message: `Created new plugin '${pluginToken.name}'`,
                data: json
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
    * Gets plugins based on the format of the request
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private getPlugins( req: modepress.IAuthReq, res: express.Response, next: Function ) {
        res.setHeader( 'Content-Type', 'application/json' );
        const model = this.getModel( 'en-plugins' );
        const that = this;
        let count = 0;

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

        // First get the count
        model.count( findToken ).then( function( num ) {
            count = num;
            return model.findInstances<HatcheryServer.IPlugin>( findToken, [], parseInt( req.query.index ), parseInt( req.query.limit ), ( getContent === false ? { html: 0 } : undefined ) );

        }).then( function( instances ) {
            const sanitizedData = [];
            for ( let i = 0, l = instances.length; i < l; i++ )
                sanitizedData.push( instances[ i ].schema.getAsJson( instances[ i ]._id, { verbose: true }) );

            return Promise.all( sanitizedData );

        }).then( function( sanitizedData ) {

            res.end( JSON.stringify( <ModepressAddons.IGetPlugins>{
                error: false,
                count: count,
                message: `Found ${count} plugins`,
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
}