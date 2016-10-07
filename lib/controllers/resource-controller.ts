import * as express from "express";
import * as modepress from "modepress-api";
import * as winston from "winston";
import * as mongodb from "mongodb";
import {EngineController} from "./engine-controller";
import {ProjectModel} from "../models/project-model";
import {PermissionController} from "./permission-controller";

/**
* An abstract controller that deals with a general set of resources. This is usually sub-classed
* to a higer level controller
*/
export class ResourceController extends EngineController
{
    private _model: modepress.Model;
    protected _resourceType: string;

	/**
	* Creates a new instance of the controller
    * @param {string} resourceType The url to represent this resource
    * @param {Model} model The model to associate with this resource
	* @param {IServer} server The server configuration options
    * @param {IConfig} config The configuration options
    * @param {express.Express} e The express instance of this server
	*/
    constructor(resourceType: string, model: modepress.Model, server: modepress.IServer, config: modepress.IConfig, e: express.Express)
    {
        super([model, modepress.Model.registerModel(ProjectModel)], server, config, e );

        this._model = model;
        this._resourceType = resourceType;

        // Get the project privilege controllers
        var canRead = PermissionController.singleton.canReadProject.bind(PermissionController.singleton);
        var canWrite = PermissionController.singleton.canWriteProject.bind(PermissionController.singleton);

        this.router.get(`/${resourceType}`, <any>[modepress.isAdmin, this.getAll.bind(this)]);
        this.router.delete(`/users/:user/projects/:project/${resourceType}/:ids`, <any>[modepress.canEdit, canWrite, this.removeResources.bind(this)]);
        this.router.put(`/users/:user/projects/:project/${resourceType}/:id`, <any>[modepress.canEdit, canWrite, this.editResource.bind(this)]);
        this.router.get(`/users/:user/projects/:project/${resourceType}/:id?`, <any>[modepress.canEdit, canRead, this.getResources.bind(this)]);
        this.router.post(`/users/:user/projects/:project/${resourceType}`, <any>[modepress.canEdit, canWrite, this.create.bind(this)]);
    }

    /**
    * Creates a new resource item
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected create(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var model = this._model;
        var projectModel = this.getModel("projects");
        var that = this;

        var newResource: HatcheryServer.IResource = req.body;

        // Set the user parameter
        newResource.user = req.params.user;

        // Check for the project and verify its valid
        var project = req.params.project;
        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid project ID" }));

        // Valid project
        newResource.projectId = new mongodb.ObjectID(project);

        // Save it in the DB
        model.createInstance<HatcheryServer.IResource>(newResource).then(function(instance)
        {
            return instance.schema.getAsJson(instance._id, {verbose: true});

        }).then(function(json){

          return res.end(JSON.stringify(<ModepressAddons.ICreateResource<any>>{
                error: false,
                message: `New resource '${newResource.name}' created`,
                data:json
            }));

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: err.message
            }));
        });
    }

    /**
    * Attempts to update a single resource
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected editResource(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var model = this._model;
        var that = this;
        var project: string = req.params.project;
        var id: string = req.params.id;
        var updateToken: HatcheryServer.IResource = {};
        var token: HatcheryServer.IResource = req.body;

        // Verify the resource ID
        if (!modepress.isValidID(id))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid resource ID" }));

        // Verify the project ID
        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid project ID" }));

        updateToken._id = new mongodb.ObjectID(id);
        updateToken.projectId = new mongodb.ObjectID(project);
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
                message: `[${instance.tokens.length}] Resources updated`
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
    * Removes a single/array of resource items
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected removeResources(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var model = this._model;
        var that = this;
        var project : string = req.params.project;
        var ids : string = req.params.ids;
        var deleteToken: HatcheryServer.IResource = {};

        // Check for the project and verify its valid
        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid project ID" }));

        // Set the user parameter
        deleteToken.user = req.params.user;

        // If ids are provided - go through and remove each one
        if (ids)
        {
            var idsArray = ids.split(",");

            if (idsArray.length > 0)
            {
                (<any>deleteToken).$or = [];

                for (var i = 0, l = idsArray.length; i < l; i++)
                    if (!modepress.isValidID(idsArray[i]))
                        return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: `ID '${idsArray[i]}' is not a valid ID` }));
                    else
                        (<any>deleteToken).$or.push(<HatcheryServer.IResource>{ _id : new mongodb.ObjectID(idsArray[i]) });
            }
        }

        // Delete the instances based onthe token
        model.deleteInstances(deleteToken).then(function (numRemoved)
        {
            res.end(JSON.stringify(<modepress.IResponse>{
                error: false,
                message: `[${numRemoved}] resources have been removed`
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
    * Given a find query, returns all resources.
    * Optional query parameters:
    *   {number} index The start index from where to fetch resources
    *   {number} limit The number of entries to be returned in the call
    *   {boolean} verbose If true, all information is returned. If false, then only public non-sensitive data
    * @param {HatcheryServer.IResource} findToken
    * @param {express.Request} req
    * @param {express.Response} res
    */
    protected getFromQuery( findToken: HatcheryServer.IResource, req: modepress.IAuthReq, res: express.Response )
    {
        var model = this._model;
        var that = this;
        var count = 0;

        // First get the count
        model.count(findToken).then(function (num)
        {
            count = num;
            return model.findInstances<HatcheryServer.IResource>(findToken, [], parseInt(req.query.index), parseInt(req.query.limit));

        }).then(function (instances)
        {
            var sanitizedData: Array<HatcheryServer.IResource> = [];
            for (var i = 0, l = instances.length; i < l; i++)
                sanitizedData.push(instances[i].schema.getAsJson(  instances[i]._id, {verbose: req._verbose}));

            return Promise.all(sanitizedData);

        }).then(function(sanitizedData){

          return res.end(JSON.stringify(<ModepressAddons.IGetResources>{
                error: false,
                count: count,
                message: `Found ${count} ${that._resourceType}`,
                data: sanitizedData
            }));

        }).catch(function (error: Error)
        {
            winston.error(error.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: error.message
            }));
        });
    }

    /**
    * Gets all resources of a given type. Only available for admin calls
    * Optional query parameters:
    *   {number} index The start index from where to fetch resources
    *   {number} limit The number of entries to be returned in the call
    *   {boolean} verbose If true, all information is returned. If false, then only public non-sensitive data
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected getAll(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        this.getFromQuery({}, req, res);
    }

    /**
    * Returns a single/array of resource items
    * Optional query parameters:
    *   {number} index The start index from where to fetch resources
    *   {number} limit The number of entries to be returned in the call
    *   {boolean} verbose If true, all information is returned. If false, then only public non-sensitive data
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected getResources(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var findToken: HatcheryServer.IResource = {};
        var project = req.params.project;
        var id = req.params.id;

        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid project ID" }));

        if (id && modepress.isValidID(id))
            findToken._id = new mongodb.ObjectID(id);

        findToken.projectId = new mongodb.ObjectID(project);

        // Check for keywords
        if (req.query.search)
            findToken.name = <any>new RegExp(req.query.search, "i");

        this.getFromQuery(findToken, req, res);
    }
}