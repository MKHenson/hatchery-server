import * as mongodb from "mongodb";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as modepress from "modepress-api";
import { UserDetailsModel } from "../models/user-details-model";
import { ProjectModel } from "../models/project-model";

/**
* A controller that deals with project models
*/
export class PermissionController extends modepress.Controller {
    public static singleton: PermissionController;

	/**
	* Creates a new instance of the controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor( server: modepress.IServer, config: modepress.IConfig, e: express.Express ) {
        super( [
            modepress.Model.registerModel( ProjectModel ),
            modepress.Model.registerModel( UserDetailsModel )
        ] );

        PermissionController.singleton = this;
    }

    /**
    * Checks if the logged in user has read access to a project's data
    * @param {modepress.IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    * @returns {Promise<boolean>} Returns a promise of true or false if the user can read a project. If false, you
    * don't need to handle an response as the function does that for you.
    */
    canReadProject( req: modepress.IAuthReq, res: express.Response, next: Function ): Promise<boolean> {
        var suppressNext = req._suppressNext;
        var user = ( req._user ? req._user.username : null );
        var project = req.params.project;
        var that = this;
        var query = {
            $or: [
                { readPrivileges: { $in: [ user ] } },
                { writePrivileges: { $in: [ user ] } },
                { adminPrivileges: { $in: [ user ] } }
            ]
        };

        return new Promise( function( resolve, reject ) {

            if ( !user ) {
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: "Please login to make this call"
                }) );
                return resolve( false );
            }

            that.checkProjectPrivilege( query, req, project ).then( function() {
                if ( !suppressNext )
                    next();
                return resolve( true );

            }).catch( function( err: Error ) {

                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: err.message
                }) );

                return resolve( false );
            });
        });
    }

    /**
    * Checks if the logged in user has write access to a project's data
    * @param {modepress.IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    * @returns {Promise<boolean>} Returns a promise of true or false if the user can write a project. If false, you
    * don't need to handle an response as the function does that for you.
    */
    canWriteProject( req: modepress.IAuthReq, res: express.Response, next: Function ): Promise<boolean> {
        var suppressNext = req._suppressNext;
        var project = req.params.project;
        var user = ( req._user ? req._user.username : null );
        var that = this;
        var query = {
            $or: [
                { writePrivileges: { $in: [ req._user.username ] } },
                { adminPrivileges: { $in: [ req._user.username ] } }
            ]
        };

        return new Promise( function( resolve, reject ) {

            if ( !user ) {
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: "Please login to make this call"
                }) );
                return resolve( false );
            }

            that.checkProjectPrivilege( query, req, project ).then( function() {
                if ( !suppressNext )
                    next();
                return resolve( true );

            }).catch( function( err: Error ) {

                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: err.message
                }) );
                return resolve( false );
            });
        });
    }

    /**
    * Checks if the logged in user has admin access to a project's data
    * @param {modepress.IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    * @returns {Promise<boolean>} Returns a promise of true or false if the user can admin a project. If false, you
    * don't need to handle an response as the function does that for you.
    */
    canAdminProject( req: modepress.IAuthReq, res: express.Response, next: Function ): Promise<boolean> {
        var suppressNext = req._suppressNext;
        var project = req.params.project;
        var that = this;
        var user = ( req._user ? req._user.username : null );
        var query = {
            adminPrivileges: { $in: [ req._user.username ] }
        };

        return new Promise( function( resolve, reject ) {

            if ( !user ) {
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: "Please login to make this call"
                }) );
                return resolve( false );
            }

            that.checkProjectPrivilege( query, req, project ).then( function() {

                if ( !suppressNext )
                    next();
                return resolve( true );

            }).catch( function( err: Error ) {

                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: err.message
                }) );
                return resolve( false );

            });
        });
    }

    /**
    * Checks if the logged in user has rights to a project
    * @param {any} query
    * @param {modepress.IAuthReq} req
    * @param {Function} next
    * @param {string} project Specify the project instead of get it from the req.parameters
    */
    checkProjectPrivilege( query: any, req: modepress.IAuthReq, project?: string ): Promise<boolean> {
        var project: string = project || req.params.project;
        var user = req.params.user;
        var projectModel = this.getModel( "en-projects" );
        var that = this;

        return new Promise( function( resolve, reject ) {

            if ( !project )
                return reject( new Error( `Project not specified` ) );

            if ( !modepress.isValidID( project ) )
                return reject( new Error( "Please use a valid project ID" ) );

            // If an admin - then the user can manage the project
            if ( req._user.privileges < 3 )
                return resolve( true );

            projectModel.count( <HatcheryServer.IProject>{ _id: new mongodb.ObjectID( project ), user: user }).then( function( count ) {
                if ( count == 0 )
                    throw new Error( "No project exists with that ID" );

                return projectModel.count( query )

            }).then( function( count ) {
                if ( count == 0 )
                    throw new Error( "User does not have permissions for project" );
                else
                    return resolve( true );

            }).catch( function( err: Error ) {
                return reject( err );
            });
        });
    }

    /**
    * Checks if the logged in user has the allowance to create a new project
    * @param {IUserEntry} user
    */
    projectsWithinLimits( user: UsersInterface.IUserEntry ): Promise<boolean> {
        // If an admin - then the user can create a new projec regardless
        if ( user.privileges < 3 )
            return Promise.resolve( true );

        var that = this;

        // Get the details
        return new Promise<boolean>( function( resolve, reject ) {
            var userModel = that.getModel( "en-user-details" );
            var projModel = that.getModel( "en-projects" );
            var username = user.username;
            var maxProjects = 0;

            userModel.findOne<HatcheryServer.IUserMeta>( <HatcheryServer.IUserMeta>{ user: username }).then( function( instance ): Promise<Error | number> {
                if ( !instance )
                    return Promise.reject<Error>( new Error( "Not found" ) );

                maxProjects = instance.dbEntry.maxProjects;

                // get number of projects
                return projModel.count( <HatcheryServer.IProject>{ user: username });

            }).then( function( numProjects ) {
                // TODO: Check if project is allowed certain plugins?

                // If num projects + 1 more is less than max we are ok
                if ( numProjects < maxProjects )
                    return resolve( true );
                else
                    return Promise.reject( new Error( `You cannot create more projects on this plan. Please consider upgrading your account` ) );

            }).catch( function( err: Error ) {
                return reject( err );
            });
        });
    }
}