import * as mongodb from "mongodb";
import * as express from "express";
import * as modepress from "modepress-api";
import {UserDetailsModel} from "../models/user-details-model";
import * as winston from "winston";
import {EngineController} from "./engine-controller";

/**
* A controller that deals with project models
*/
export class UserDetailsController extends EngineController
{
    public static singleton: UserDetailsController;

	/**
	* Creates a new instance of the controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor(server: modepress.IServer, config: modepress.IConfig, e: express.Express)
    {
        super([ modepress.Model.registerModel(UserDetailsModel)], server, config, e);

        UserDetailsController.singleton = this;

        this.router.get("/user-details/:user", <any>[modepress.isAuthenticated, this.getDetails.bind(this)]);
        this.router.post("/user-details/:target", <any>[modepress.isAdmin, this.createDetails.bind(this)]);
        this.router.put("/user-details/:user", <any>[modepress.canEdit, this.updateDetails.bind(this)]);

        let userActivated : UsersInterface.SocketTokens.ClientInstructionType = 'Activated';
        let userRemoved : UsersInterface.SocketTokens.ClientInstructionType = 'Removed';
        modepress.EventManager.singleton.on(userActivated, this.onActivated.bind(this));
        modepress.EventManager.singleton.on(userRemoved, this.onRemoved.bind(this));
    }

    /**
    * Called whenever a user has had their account removed
    * @param {UsersInterface.SocketTokens.IUserToken} token
    */
    private onRemoved(token: UsersInterface.SocketTokens.IUserToken)
    {
        var model = this.getModel("en-user-details");
        model.deleteInstances(<HatcheryServer.IUserMeta>{ user: token.username }).then(function ()
        {
            winston.info(`User details for ${token.username} have been deleted`, { process: process.pid });

        }).catch(function (err: Error)
        {
            winston.error(`An error occurred while deleteing user details for ${token.username} : ${err.message}`, { process: process.pid });
        });
    }

    /**
    * Attempts to update users details
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    private updateDetails(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var model = this.getModel("en-user-details");
        var that = this;
        var user: string = req.params.user;
        var updateToken: HatcheryServer.IUserMeta = { user: user };
        var token: HatcheryServer.IUserMeta = req.body;

        model.update(updateToken, token).then(function (instance)
        {
            if (instance.error)
            {
                winston.error(<string>instance.tokens[0].error, { process: process.pid });
                return res.end(JSON.stringify(<modepress.IResponse>{
                    error: true,
                    message: <string>instance.tokens[0].error
                }));
            }

            res.end(JSON.stringify(<modepress.IResponse>{
                error: false,
                message: `Details updated`
            }));

        }).catch(function (error: Error)
        {
            winston.error(error.message, { process: process.pid });
            res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: error.message
            }));
        });
    }

    /**
    * Called whenever a user has activated their account. We setup their app engine specific details
    * @param {UsersInterface.SocketTokens.IUserToken} token
    */
    private onActivated(token: UsersInterface.SocketTokens.IUserToken)
    {
        var model = this.getModel("en-user-details");
        model.createInstance(<HatcheryServer.IUserMeta>{ user: token.username }).then(function (instance)
        {
            winston.info(`Created user details for ${token.username}`, { process: process.pid });

        }).catch(function (err: Error)
        {
            winston.error(`An error occurred while creating creating user details for ${token.username} : ${err.message}`, { process: process.pid });
        });
    }

    /**
    * Gets user details for a target 'user'. By default the data is santized, but you can use the verbose query to get all data values.
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    getDetails(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        var that = this;
        res.setHeader('Content-Type', 'application/json');

        var model = that.getModel("en-user-details");
        var target = req.params.user;

        model.findOne<HatcheryServer.IUserMeta>(<HatcheryServer.IUserMeta>{ user: target }).then(function(instance) : Promise<Error|Promise<HatcheryServer.IUserMeta>>
        {
            if (!instance)
                return Promise.reject<Error>(new Error("User does not exist"));

            return instance.schema.getAsJson( instance._id, {verbose: req._verbose});

        }).then(function(json){

            return res.end(JSON.stringify(<ModepressAddons.IGetDetails>{
                error: false,
                message: `Found details for user '${target}'`,
                data: json
            }));

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: `Could not find details for target '${target}' : ${err.message}`
            }));
        });
    }

    /**
    * Creates user details for a target user
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    createDetails(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        var that = this;
        res.setHeader('Content-Type', 'application/json');
        modepress.UsersService.getSingleton().getUser(req.params.target, req).then(function (getReq)
        {
            if (getReq.error)
                return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: getReq.message }));

            var user = getReq.data;

            if (!user)
                return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: `No user exists with the name '${req.params.target}'` }));

            var model = that.getModel("en-user-details");

            // User exists and is ok - so lets create their details
            model.createInstance(<HatcheryServer.IUserMeta>{ user: user.username }).then(function (instance)
            {
                return res.end(JSON.stringify(<modepress.IResponse>{
                    error: false,
                    message: `Created user details for target ${user.username}`
                }));

            }).catch(function (err: Error)
            {
                winston.error(err.message, { process: process.pid });
                return res.end(JSON.stringify(<modepress.IResponse>{
                    error: true,
                    message: `Could not create user details for target ${user.username} : ${err.message}`
                }));
            });

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: err.message
            }));
        })
    }
}