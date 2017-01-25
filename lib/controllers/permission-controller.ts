import * as mongodb from 'mongodb';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as modepress from 'modepress-api';
import { UserDetailsModel } from '../models/user-details-model';
import { ProjectModel } from '../models/project-model';

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
    async canReadProject( req: modepress.IAuthReq, res: express.Response, next: Function ): Promise<boolean> {
        const suppressNext = req._suppressNext;
        const user = ( req._user ? req._user.username : null );
        const project = req.params.project;
        const query = {
            $or: [
                { readPrivileges: { $in: [ user ] } },
                { writePrivileges: { $in: [ user ] } },
                { adminPrivileges: { $in: [ user ] } }
            ]
        };

        try {
            if ( !user ) {
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: 'Please login to make this call'
                }) );
                return false;
            }

            await this.checkProjectPrivilege( query, req, project );
            if ( !suppressNext )
                next();

            return true;

        }
        catch ( err ) {
            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: err.message
            }) );

            return false;
        }
    }

    /**
    * Checks if the logged in user has write access to a project's data
    * @param {modepress.IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    * @returns {Promise<boolean>} Returns a promise of true or false if the user can write a project. If false, you
    * don't need to handle an response as the function does that for you.
    */
    async canWriteProject( req: modepress.IAuthReq, res: express.Response, next: Function ): Promise<boolean> {
        const suppressNext = req._suppressNext;
        const project = req.params.project;
        const user = ( req._user ? req._user.username : null );
        const query = {
            $or: [
                { writePrivileges: { $in: [ req._user!.username ] } },
                { adminPrivileges: { $in: [ req._user!.username ] } }
            ]
        };

        try {
            if ( !user ) {
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: 'Please login to make this call'
                }));
                return false;
            }

            await this.checkProjectPrivilege( query, req, project );
            if ( !suppressNext )
                next();

            return true;

        }
        catch ( err ) {

            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: err.message
            }) );
            return false;
        }
    }

    /**
    * Checks if the logged in user has admin access to a project's data
    * @param {modepress.IAuthReq} req
    * @param {express.Response} res
    * @param {Function} next
    * @returns {Promise<boolean>} Returns a promise of true or false if the user can admin a project. If false, you
    * don't need to handle an response as the function does that for you.
    */
    async canAdminProject( req: modepress.IAuthReq, res: express.Response, next: Function ): Promise<boolean> {
        const suppressNext = req._suppressNext;
        const project = req.params.project;
        const user = ( req._user ? req._user.username : null );
        const query = {
            adminPrivileges: { $in: [ req._user!.username ] }
        };

        try {
            if ( !user ) {
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( JSON.stringify( <modepress.IResponse>{
                    error: true,
                    message: 'Please login to make this call'
                }) );

                return false;
            }

            await this.checkProjectPrivilege( query, req, project );

            if ( !suppressNext )
                next();

            return true;

        }
        catch ( err ) {

            res.setHeader( 'Content-Type', 'application/json' );
            res.end( JSON.stringify( <modepress.IResponse>{
                error: true,
                message: err.message
            }) );
            return false;
        }
    }

    /**
    * Checks if the logged in user has rights to a project
    * @param {any} query
    * @param {modepress.IAuthReq} req
    * @param {Function} next
    * @param {string} p Specify the project instead of get it from the req.parameters
    */
    async checkProjectPrivilege( query: any, req: modepress.IAuthReq, p?: string ): Promise<boolean> {
        const project: string = p || req.params.project;
        const user = req.params.user;
        const projectModel = this.getModel( 'en-projects' );

        if ( !project )
            throw new Error( `Project not specified` );

        if ( !modepress.isValidID( project ) )
            throw new Error( 'Please use a valid project ID' );

        // If an admin - then the user can manage the project
        if ( req._user!.privileges < 3 )
            return true;

        let count = await projectModel.count( <HatcheryServer.IProject>{ _id: new mongodb.ObjectID( project ), user: user });
        if ( count === 0 )
            throw new Error( 'No project exists with that ID' );

        count = await projectModel.count( query );
        if ( count === 0 )
            throw new Error( 'User does not have permissions for project' );
        else
            return true;
    }

    /**
    * Checks if the logged in user has the allowance to create a new project
    * @param {IUserEntry} user
    */
    async projectsWithinLimits( user: UsersInterface.IUserEntry ): Promise<boolean> {
        // If an admin - then the user can create a new projec regardless
        if ( user.privileges < 3 )
            return true;

        // Get the details
        const userModel = this.getModel( 'en-user-details' );
        const projModel = this.getModel( 'en-projects' );
        const username = user.username;
        let maxProjects = 0;

        const instance = await userModel.findOne<HatcheryServer.IUserMeta>( <HatcheryServer.IUserMeta>{ user: username });

        if ( !instance )
            throw new Error( 'Not found' );

        maxProjects = instance.dbEntry.maxProjects!;

        // get number of projects
        const numProjects = await projModel.count( <HatcheryServer.IProject>{ user: username });

        // TODO: Check if project is allowed certain plugins?

        // If num projects + 1 more is less than max we are ok
        if ( numProjects < maxProjects )
            return true;
        else
            throw new Error( `You cannot create more projects on this plan. Please consider upgrading your account` );
    }
}