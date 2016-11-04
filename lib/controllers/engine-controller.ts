import * as mongodb from 'mongodb';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as modepress from 'modepress-api';

/**
* A base controller for engine controllers
*/
export class EngineController extends modepress.Controller {
    protected router: express.Router;

	/**
	* Creates a new instance of the controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor( models: Array<modepress.Model>, server: modepress.IServer, config: modepress.IConfig, e: express.Express ) {
        super( models );

        this.router = express.Router();
        this.router.use( bodyParser.urlencoded( { 'extended': true }) );
        this.router.use( bodyParser.json() );
        this.router.use( bodyParser.json( { type: 'application/vnd.api+json' }) );

        // Register the path
        e.use( '/app-engine', this.router );
    }
}