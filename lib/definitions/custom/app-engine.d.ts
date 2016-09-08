declare module Engine
{
    export namespace Editor {

        /**
        * A basic wrapper for a Portal interface
        */
        export class IPortal {
            name: string;
            type: HatcheryRuntime.PortalType;
            custom: boolean;
            property: any;
        }

        /**
         * A basic wrapper for a CanvasItem interface
         */
        export interface ICanvasItem {
            id: number;
            type: HatcheryRuntime.ItemType | 'comment' | 'shortcut';
            left: number;
            top: number;
        }

        /**
        * A basic wrapper for a Link interface
        */
        export interface ILinkItem extends ICanvasItem {
            frameDelay: number;
            startPortal: string;
            endPortal: string;
            startBehaviour: number;
            endBehaviour: number;
        }

        /**
        * A basic wrapper for a Behaviour interface
        */
        export interface IBehaviour extends ICanvasItem {
            alias: string;
            behaviourType: string;
            portals?: IPortal[];
        }

        /**
        * A basic wrapper for a Comment interface
        */
        export interface IComment extends ICanvasItem {
            label: string;
            width : number;
            height : number;
        }

        /**
        * A basic wrapper for a BehaviourPortal interface
        */
        export interface IBehaviourPortal extends IBehaviour {
            portal: IPortal;
        }

        /**
        * A basic wrapper for a BehaviourScript interface
        */
        export interface IBehaviourScript extends IBehaviour {
            scriptId: string;
        }

        /**
        * A basic wrapper for a BehaviourShortcut interface
        */
        export interface IBehaviourShortcut extends IBehaviour {
            targetId: number;
        }

        /**
        * A basic interface for a container object
        */
        export interface IContainerWorkspace {
            items: ICanvasItem[];
            properties: any;
        }
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
        json?: Editor.IContainerWorkspace;
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
    export interface ICreateProject extends Modepress.IGetResponse<Engine.IProject> { }
    export interface ICreateResource<T> extends Modepress.IGetResponse<T> { }
    export interface ICreateAsset extends Modepress.IGetResponse<Engine.IAsset> { }
    export interface ICreateBehaviour extends Modepress.IGetResponse<Engine.IContainer> { }
    export interface ICreateFile extends Modepress.IGetResponse<Engine.IFile> { }
    export interface ICreateGroup extends Modepress.IGetResponse<Engine.IGroup> { }
    export interface ICreatePlugin extends Modepress.IGetResponse<Engine.IPlugin> { }
    export interface ICreateBuild extends Modepress.IGetResponse<Engine.IBuild> { }

    export interface IGetBuilds extends Modepress.IGetArrayResponse<Engine.IBuild> { }
    export interface IGetProjects extends Modepress.IGetArrayResponse<Engine.IProject> { }
    export interface IGetDetails extends Modepress.IGetResponse<Engine.IUserMeta> { }
    export interface IGetBehaviours extends Modepress.IGetArrayResponse<Engine.IContainer> { }
    export interface IGetFiles extends Modepress.IGetArrayResponse<Engine.IFile> { }
    export interface IGetGroups extends Modepress.IGetArrayResponse<Engine.IGroup> { }
    export interface IGetAssets extends Modepress.IGetArrayResponse<Engine.IAsset> { }
    export interface IGetPlugins extends Modepress.IGetArrayResponse<Engine.IPlugin> { }
    export interface IGetResources extends Modepress.IGetArrayResponse<Engine.IResource> { }
}

declare module "engine" {
    export = Engine;
}

declare module "modepress-addons"
{
    export = ModepressAddons;
}