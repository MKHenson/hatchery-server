import * as mongodb from "mongodb";
import * as express from "express";
import * as modepress from "modepress-api";
import {UserDetailsModel} from "../models/user-details-model";
import {IProject} from "engine";
import * as winston from "winston";
import {FileModel} from "../models/file-model";
import * as request from "request"
import {EngineController} from "./engine-controller";

/**
* A controller that deals with project models
*/
export class FileController extends EngineController
{
    constructor(server: modepress.IServer, config: modepress.IConfig, e: express.Express)
    {
        super([ modepress.Model.registerModel(FileModel)], server, config, e);

        this.router.put("/users/:user/files/:id", <any>[modepress.canEdit, this.editFileDetails.bind(this)]);
        this.router.get("/users/:user/projects/:project/files", <any>[modepress.canEdit, this.getByProject.bind(this)]);
        this.router.get("/users/:user/files", <any>[modepress.canEdit, this.getByUser.bind(this)]);

        let fileUploadedEvent : UsersInterface.SocketTokens.ClientInstructionType = 'FileUploaded';
        let fileRemovedEvent : UsersInterface.SocketTokens.ClientInstructionType = 'FileRemoved';
        modepress.EventManager.singleton.on(fileUploadedEvent, this.onFilesUploaded.bind(this));
        modepress.EventManager.singleton.on(fileRemovedEvent, this.onFilesRemoved.bind(this));
    }

    /**
    * Attempts to update a single file's details
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected editFileDetails(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');
        var model = this.getModel("en-files");
        var that = this;

        // Verify the resource ID
        if (!modepress.isValidID(req.params.id))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid resource ID" }));

        var searchToken: Engine.IFile = { _id: new mongodb.ObjectID(req.params.id) };
        var token: Engine.IResource = req.body;

        model.update(searchToken, token).then(function (instance)
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
                message: `[${instance.tokens.length}] Files updated`
            }));

        }).catch(function (error: Error)
        {
            winston.error("Could not update file details: " + error.message, { process: process.pid });
            res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Could not update file details: " + error.message }));
        });
    }

    /**
    * Fetches files by a given query
    * @param {any} query A mongo DB style query
    * @param {number} index The index start
    * @param {number} limit The limit
    * @param {number} verbose Weather or not to use verbose
    */
    private getFiles(query: any, index: number, limit: number, verbose: boolean = true ): Promise<ModepressAddons.IGetFiles>
    {
        var model = this.getModel("en-files");
        var that = this;
        var count = 0;

        return new Promise<ModepressAddons.IGetFiles>(function (resolve, reject)
        {
            // First get the count
            model.count(query).then(function (num)
            {
                count = num;
                return model.findInstances<Engine.IFile>(query, [], index, limit);

            }).then(function (instances)
            {
                var sanitizedData : Array<Engine.IFile> = [];
                for (var i = 0, l = instances.length; i < l; i++)
                    sanitizedData.push(instances[i].schema.getAsJson(instances[i]._id, {verbose: verbose}));

                return Promise.all(sanitizedData);

            }).then(function(sanitizedData){

              resolve( {
                    error: false,
                    count: count,
                    message: `Found ${count} files`,
                    data: sanitizedData
                });

            }).catch(function (error: Error)
            {
                reject(error);
            });
        });
    }

    /**
    * Checks for and adds any optional file queries
    * @param {Engine.IFile} query
    * @param {any} params
    */
    private appendOptionalQueries(query: Engine.IFile, params: any)
    {
        // Check for keywords
        if (params.search)
        {
            (<any>query).$or = [
                { name: new RegExp(params.search, "i") },
                { tags : { $in: [new RegExp(params.search, "i")] } }
            ];
        }

        // Check for favourites
        if (params.favourite && params.favourite.toLowerCase() == "true")
            query.favourite = true;

        // Check for global
        if (params.global && params.global.toLowerCase() == "true")
            query.global = true;

        // Check for bucket ID
        if (params.bucket)
            query.bucketName = params.bucket;

        query.browsable = true;
    }

    /**
    * Gets the files from the project
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected getByProject(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');

        var project = req.params.project;
        if (!modepress.isValidID(project))
            return res.end(JSON.stringify(<modepress.IResponse>{ error: true, message: "Please use a valid project ID" }));

        // Create the query
        var query: Engine.IFile = { projectId: new mongodb.ObjectID(project), user: req._user.username, browsable : true };
        this.appendOptionalQueries(query, req.query);

        this.getFiles(query, parseInt(req.query.index), parseInt(req.query.limit)).then(function (data)
        {
            return res.end(JSON.stringify(data));

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: `An error occurred while fetching the files : ${err.message}`
            }));
        });
    }

    /**
    * Gets the files from just the user
    * @param {express.Request} req
    * @param {express.Response} res
    * @param {Function} next
    */
    protected getByUser(req: modepress.IAuthReq, res: express.Response, next: Function)
    {
        res.setHeader('Content-Type', 'application/json');

        // Create the query
        var query: Engine.IFile = { user: req._user.username, browsable: true };
        this.appendOptionalQueries(query, req.query);

        this.getFiles(query, parseInt(req.query.index), parseInt(req.query.limit)).then(function (data)
        {
            return res.end(JSON.stringify(data));

        }).catch(function (err: Error)
        {
            winston.error(err.message, { process: process.pid });
            return res.end(JSON.stringify(<modepress.IResponse>{
                error: true,
                message: `An error occurred while fetching the files : ${err.message}`
            }));
        });
    }

    /**
    * Called whenever a user has uploaded files
    * @param {UsersInterface.SocketTokens.IFileToken} token
    */
    private onFilesUploaded(token: UsersInterface.SocketTokens.IFileToken)
    {
        var model = this.getModel("en-files");
        var file = token.file;
        var promises: Array<Promise<modepress.ModelInstance<Engine.IFile>>> = [];


        // Add an IFile reference for each file thats added
        // Check for file meta
        var fileMeta: Engine.IFileMeta = file.meta;

        promises.push(model.createInstance<Engine.IFile>(<Engine.IFile>{
            bucketId: file.bucketId,
            bucketName: file.bucketName,
            user: file.user,
            url: file.publicURL,
            extension: file.mimeType,
            name: file.name,
            identifier: file.identifier,
            size: file.size,
            browsable: (fileMeta && fileMeta.browsable ? true : false)
        }));

        // Save it in the DB
        Promise.all(promises).then(function(instances)
        {
            winston.info(`[${instances.length}] Files have been added`, { process: process.pid });

        }).catch(function (err: Error)
        {
            winston.error(`Could not add file instances : ${err.message}`, { process: process.pid });
        });
    }

    /**
    * Called whenever a user has uploaded files
    * @param {UsersInterface.SocketTokens.IFileToken} token
    */
    private onFilesRemoved(token: UsersInterface.SocketTokens.IFileToken)
    {
        var model = this.getModel("en-files");

        model.deleteInstances( <Engine.IFile>{ identifier: token.file.identifier }).then(function (numRemoved: number)
        {
            winston.info(`[${numRemoved}] Files have been removed`, { process: process.pid });

        }).catch(function (err: Error)
        {
            winston.error(`Could not remove file instances : ${err.message}`, { process: process.pid });
        });
    }
}