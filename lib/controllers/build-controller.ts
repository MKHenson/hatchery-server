﻿import * as mongodb from "mongodb";
import * as express from "express";
import * as modepress from "modepress-api";
import {BuildModel} from "../models/build-model";
import {IProject} from "engine";
import * as winston from "winston";
import {EngineController} from "./engine-controller";

/**
* A controller that deals with build models
*/
export class BuildController extends EngineController
{
    public static singleton: BuildController;

	/**
	* Creates a new instance of the  controller
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor(server: modepress.IServer, config: modepress.IConfig, e: express.Express)
    {
        super([modepress.Model.registerModel(BuildModel)], server, config, e);
        BuildController.singleton = this;

        // Define the routes
        this.router.get("/users/:user/projects/:project/builds/:id?", <any>[modepress.canEdit, this.getBuilds.bind(this)]);
        this.router.post("/users/:user/projects/:project/builds", <any>[modepress.canEdit, this.create.bind(this)]);
        this.router.put("/users/:user/projects/:project/builds/:id", <any>[modepress.canEdit, this.edit.bind(this)]);
    }

    /**
    * Gets all builds associated with a particular user & project
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    getBuilds(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        var that = this;
        res.setHeader('Content-Type', 'application/json');
        var target = req.params.user;
        var project = req.params.project;
        var model = that.getModel("en-builds");
        var totalMatches = 0;

        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: `Please use a valid project ID` }));

        var findToken: Engine.IBuild = { user: target, projectId: new mongodb.ObjectID(project) };

        if (req.params.id && modepress.isValidID(req.params.id))
            findToken._id = new mongodb.ObjectID(req.params.id);

        model.count(findToken).then(function(total)
        {
            totalMatches = total;
            return model.findInstances<Engine.IBuild>(findToken, [], parseInt(req.query.index), parseInt(req.query.limit));

        }).then(function (instances)
        {
            var sanitizedData = [];
            for (var i = 0, l = instances.length; i < l; i++)
                sanitizedData.push(instances[i].schema.getAsJson( instances[i]._id, {verbose: Boolean(req.query.verbose)}));

            return Promise.all(sanitizedData);

        }).then(function(sanitizedData) {

          return res.end(JSON.stringify(<ModepressAddons.IGetBuilds>{
                error: false,
                message: `Found [${totalMatches}] builds for user '${target}'`,
                count: totalMatches,
                data: sanitizedData
            }));

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: `Could not get builds for '${target}' : ${err.message}`
            }));
        });
    }

    /**
    * Creates a new build
    * @returns {Promise<Modepress.ModelInstance<Engine.IBuild>>}
    */
    createBuild(username: string, project?: mongodb.ObjectID): Promise<Modepress.ModelInstance<Engine.IBuild>>
    {
        var that = this;
        var model = that.getModel("en-builds");

        return new Promise<Modepress.ModelInstance<Engine.IBuild>>(function (resolve, reject)
        {
            model.createInstance(<Engine.IBuild>{ name: '', user: username, projectId : project }).then(function (instance)
            {
                return resolve(instance);

            }).catch(function (err: Error)
            {
                winston.error(err.message, { process: process.pid });
                return reject(err);
            });
        });
    }

    /**
    * Removes a build by its id
    * @param {Array<string>} ids
    * @param {string} user The username of the user
    * @returns {Promise<number>}
    */
    removeByIds(ids: Array<string>, user: string): Promise<number>
    {
        var that = this;
        var model = that.getModel("en-builds");

        var findToken: Engine.IBuild = { user: user };
        var $or: Array<Engine.IBuild> = [];
        for (var i = 0, l = ids.length; i < l; i++)
            $or.push({ _id: new mongodb.ObjectID(ids[i]) });

        if ($or.length > 0)
            findToken["$or"] = $or;

        return new Promise<number>(function (resolve, reject)
        {
            model.deleteInstances(findToken).then(function (numDeleted)
            {
                return resolve(numDeleted);

            }).catch(function (err: Error)
            {
                winston.error(err.message, { process: process.pid });
                return reject(err);
            });
        });
    }

    /**
    * Removes a build by its user
    * @param {string} user The username of the user
    * @returns {Promise<number>}
    */
    removeByUser(user: string): Promise<number>
    {
        var that = this;
        var model = that.getModel("en-builds");

        return new Promise<number>(function (resolve, reject)
        {
            model.deleteInstances(<Engine.IBuild>{ user: user }).then(function (instance)
            {
                return resolve(instance);

            }).catch(function (err: Error)
            {
                winston.error(err.message, { process: process.pid });
                return reject(err);
            });
        });
    }

    /**
    * Removes a build by its project ID
    * @param {ObjectID} project The id of the project
    * @param {string} user The username of the user
    * @returns {Promise<number>}
    */
    removeByProject(project: mongodb.ObjectID, user: string): Promise<number>
    {
        var that = this;
        var model = that.getModel("en-builds");

        return new Promise<number>(function (resolve, reject)
        {
            model.deleteInstances(<Engine.IBuild>{ projectId: project, user: user }).then(function (instance)
            {
                return resolve(instance);

            }).catch(function (err: Error)
            {
                winston.error(err.message, { process: process.pid });
                return reject(err);
            });
        });
    }

    /**
    * Removes a build by its id
    * @returns {Promise<any>}
    */
    linkProject(buildId: string, projId: string): Promise<any>
    {
        var that = this;
        var model = that.getModel("en-builds");

        return new Promise<any>(function (resolve, reject)
        {
            model.update(<Engine.IBuild>{ _id: new mongodb.ObjectID(buildId) }, <Engine.IBuild>{ projectId: new mongodb.ObjectID(projId) }).then(function (instances)
            {
                if (instances.error)
                    return Promise.reject(new Error("An error has occurred while linking the build with a project"));

                return resolve();

            }).catch(function (err: Error)
            {
                winston.error(err.message, { process: process.pid });
                return reject(err);
            });
        });
    }

    /**
    * Attempts to update a build's data
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected edit(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var that = this;
        var model = that.getModel("en-builds");
        var project: string = req.params.project;
        var id: string = req.params.id;
        var search: Engine.IBuild = {};
        var token: Engine.IBuild = req.body;

        // Verify the resource ID
        if (!modepress.isValidID(id))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid resource ID" }));

        // Verify the project ID
        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid project ID" }));

        search._id = new mongodb.ObjectID(id);
        search.projectId = new mongodb.ObjectID(project);
        model.update(search, token).then(function (instance)
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
                message: `[${instance.tokens.length}] Build updated`
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
    * Creates a new build for a user in a specific project.
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    create(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        var that = this;
        res.setHeader('Content-Type', 'application/json');
        var target = req.params.user;
        var project = req.params.project;
        var model = that.getModel("en-builds");
        var setAsCurrent = (req.query["set-current"] ? true : false);

        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<ModepressAddons.IGetBuilds>{ error: true, message: `Please use a valid project ID` }));

        var newBuild : modepress.ModelInstance<Engine.IBuild>;



        that.createBuild( target, new mongodb.ObjectID(project) ).then(function( instance ) {

            newBuild = instance;
            var toRet : Promise<Modepress.UpdateRequest<Engine.IProject>>;

            if (setAsCurrent)
            {
                var m = that.getModel("en-projects")
                toRet = m.update<Engine.IProject>(<Engine.IProject>{
                    _id: new mongodb.ObjectID(project) }, { build: instance._id });
            }
            else
                toRet = Promise.resolve( <Modepress.UpdateRequest<Engine.IProject>>{ error: false, tokens: [] } );

            return toRet;

        }).then(function( updateToken ) : Promise<Error|Engine.IBuild> {

            if (updateToken.error)
                return Promise.reject<Error>(new Error( <string>updateToken.tokens[0].error ));

            return newBuild.schema.getAsJson<Engine.IBuild>(newBuild._id, {verbose: true});

        }).then(function(sanitizedData : Engine.IBuild ){

          return res.end(JSON.stringify( <ModepressAddons.IGetBuilds> {
                error: false,
                message: `Created new build for user '${target}'`,
                count: 1,
                data: sanitizedData
            }));

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: `Could not create build for '${target}' : ${err.message}`
            }));
        });
    }
}