import * as mongodb from "mongodb";
import * as express from "express";
import { Controller, IServer, IConfig } from "modepress-api";
import { ProjectController } from "./controllers/project-controller";
import { PluginController } from "./controllers/plugin-controller";
import { ResourceController } from "./controllers/resource-controller";
import { UserDetailsController } from "./controllers/user-details-controller";
import { PermissionController } from "./controllers/permission-controller";
import { FileController } from "./controllers/file-controller";
import { BuildController } from "./controllers/build-controller";
import { AssetModel } from "./models/asset-model";
import { ContainerModel } from "./models/container-model";
import { ScriptModel } from "./models/script-model";
import { GroupModel } from "./models/group-model";

/**
* A plugin that loads the app engine controllers for use in Modepress
*/
export default class AppEngine extends Controller {
    private _controllers: Array<Controller>;

	/**
	* Creates a new instance of the email controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor( server: IServer, config: IConfig, e: express.Express ) {
        super( null );

        this._controllers = [
            new UserDetailsController( server, config, e ),
            new PermissionController( server, config, e ),
            new PluginController( server, config, e ),
            new ResourceController( "assets", new AssetModel(), server, config, e ),
            new ResourceController( "groups", new GroupModel(), server, config, e ),
            new ResourceController( "containers", new ContainerModel(), server, config, e ),
            new ResourceController( "scripts", new ScriptModel(), server, config, e ),
            new FileController( server, config, e ),
            new ProjectController( server, config, e ),
            new BuildController( server, config, e )
        ];
    }

    /**
    * Called to initialize this controller and its related database objects
    * @param {mongodb.Db} db The mongo database to use
    * @returns {Promise<Controller>}
    */
    initialize( db: mongodb.Db ): Promise<Controller> {
        var promises: Array<Promise<Controller>> = [];
        var that = this;

        for ( var i = 0, ctrls = this._controllers, l = ctrls.length; i < l; i++ )
            promises.push( ctrls[ i ].initialize( db ) );

        return new Promise<Controller>( function( resolve, reject ) {
            Promise.all( promises ).then( function() {
                resolve( that );

            }).catch( function( err ) {
                resolve( err );
            });
        })
    }
}