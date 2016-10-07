declare module HatcheryServer {

    /**
     * An interface for describing a container workspace
     * The frontend project can extend this interface and flesh out its inner workings
     */
    export interface IContainerWorkspace {

    }

    export interface IResource
    {
        name?: string;
        projectId?: any;
        user?: string;
        shallowId?: number;
        createdOn?: number;
        lastModified?: number;
        _id?: any;
    }

    /**
    * The interface for working with scripts
    */
    export interface IScript extends IResource
    {
        onEnter?: string;
        onInitialize?: string;
        onDispose?: string;
        onFrame?: string;
    }

    /**
    * An interface that is used to describe the assets model
    */
    export interface IAsset extends IResource
    {
        className?: string;
        json?: Array<{ name: string; category: string; value: any; type: string; }>;
    }

    /**
    * An interface that is used to describe project behaviours
    */
    export interface IContainer extends IResource
    {
        json?: IContainerWorkspace;
    }

    /**
    * An interface that is used to describe project groups
    */
    export interface IGroup extends IResource
    {
        items?: Array<number>;
    }

    /**
    * An interface that is used to describe the plugin model
    */
    export interface IPlugin
    {
        name?: string;
        description?: string;
        url?: string;
        plan?: number;
        deployables?: Array<string>;
        image?: string;
        author?: string;
        version?: string;
        createdOn?: number;
        lastModified?: number;
        isPublic?: boolean;
        _id?: any;
    }

    /**
    * An interface that is used to describe the project model
    */
    export interface IProject
    {
        name?: string;
        description?: string;
        image?: string;
        category?: number;
        subCategory?: string;
        public?: boolean;
        curFile?: string;
        rating?: number;
        suspicious?: boolean;
        deleted?: boolean;
        numRaters?: number;
        user?: string;
        build?: any;
        type?: number;
        tags?: Array<string>;
        readPrivileges?: Array<string>;
        writePrivileges?: Array<string>;
        adminPrivileges?: Array<string>;
        plugins?: Array<any>;
        files?: Array<string>;
        createdOn?: number;
        lastModified?: number;
        _id?: any;
    }

    /**
    * An interface that is used to describe the user's engine details
    */
    export interface IUserMeta
    {
        user?: string;
        bio?: string;
        image?: string;
        plan?: number;
        website?: string;
        customerId?: string;
        maxProjects?: number;
        _id?: any;
    }

    /**
    * An interface that is used to describe a project build
    */
    export interface IBuild
    {
        name?: string;
        projectId?: any;
        user?: string;
        _id?: any;
        notes?: string;
        version?: string;
        public?: boolean;
        html?: string;
        css?: string;
        liveHTML?: string;
        liveLink?: string;
        liveToken?: string;
        totalVotes?: number;
        totalVoters?: number;
        createdOn?: number;
        lastModified?: number;
    }



    /**
    * An interface that is used to describe users files
    */
    export interface IFile extends IResource
    {
        url?: string;
        tags ?: Array<string>;
        extension?: string;
        previewUrl ?: string;
        global ?: boolean;
        favourite?: boolean;
        browsable?: boolean;
        size ?: number;
        bucketId?: string;
        bucketName?: string;
        identifier?: string;
    }

    /**
    * An interface to describe the meta data we react to with file uploads
    */
    export interface IFileMeta extends IResource
    {
        browsable: boolean;
    }
}

declare module ModepressAddons
{
    export interface ICreateProject extends Modepress.IGetResponse<HatcheryServer.IProject> { }
    export interface ICreateResource<T> extends Modepress.IGetResponse<T> { }
    export interface ICreateAsset extends Modepress.IGetResponse<HatcheryServer.IAsset> { }
    export interface ICreateBehaviour extends Modepress.IGetResponse<HatcheryServer.IContainer> { }
    export interface ICreateFile extends Modepress.IGetResponse<HatcheryServer.IFile> { }
    export interface ICreateGroup extends Modepress.IGetResponse<HatcheryServer.IGroup> { }
    export interface ICreatePlugin extends Modepress.IGetResponse<HatcheryServer.IPlugin> { }
    export interface ICreateBuild extends Modepress.IGetResponse<HatcheryServer.IBuild> { }

    export interface IGetBuilds extends Modepress.IGetArrayResponse<HatcheryServer.IBuild> { }
    export interface IGetProjects extends Modepress.IGetArrayResponse<HatcheryServer.IProject> { }
    export interface IGetDetails extends Modepress.IGetResponse<HatcheryServer.IUserMeta> { }
    export interface IGetBehaviours extends Modepress.IGetArrayResponse<HatcheryServer.IContainer> { }
    export interface IGetFiles extends Modepress.IGetArrayResponse<HatcheryServer.IFile> { }
    export interface IGetGroups extends Modepress.IGetArrayResponse<HatcheryServer.IGroup> { }
    export interface IGetAssets extends Modepress.IGetArrayResponse<HatcheryServer.IAsset> { }
    export interface IGetPlugins extends Modepress.IGetArrayResponse<HatcheryServer.IPlugin> { }
    export interface IGetResources extends Modepress.IGetArrayResponse<HatcheryServer.IResource> { }
}

declare module "hatchery-server" {
    export = HatcheryServer;
}

declare module "modepress-addons"
{
    export = ModepressAddons;
}