declare namespace HatcheryRuntime {

    export namespace Events {

        export interface IAssetEvent { asset : Asset }
        export interface IContainerEvent { container : Container }
        export interface IMessageEvent { message : string }
        export interface IRuntimeEvent { container : Container, percentage: number }

        /**
         * Describes asset related events
         */
        type AssetEvents = 'asset-loaded';

        /**
         * Describes container related events
         */
        type ContainerEvents = 'container-loaded';

        /**
         * Describes events sent by the messenger
         */
        type MessengerEvents = 'on-message';

        /**
         * Describes events sent by the runtime
         */
        type RuntimeEvents = 'load-progress';
    }

    /**
     * Describes a portal's function
     */
    export type PortalType = 'input' | 'output' | 'parameter' | 'product';

    /**
     * Describes the item type
     */
    export type ItemType = 'behaviour' | 'link' | 'asset' | 'shortcut' | 'portal' | 'script' | 'comment' | 'instance';

    /**
     * Describes the types of objects we can interact with from a scene
     */
    export type DataType = 'asset' | 'number' | 'group' | 'file' | 'string' | 'any' | 'bool' | 'int' | 'color' | 'enum' | 'hidden';

    /**
     * A basic wrapper for a Portal interface
     */
    export interface IPortal {
        name: string;
        type: PortalType;
        custom: boolean;
        valueType: DataType;
        value: any;
        left?: number;
        top?: number;
    }

    /**
     * A basic wrapper for a CanvasItem interface
     */
    export interface ICanvasItem {
        id?: number;
        type?: ItemType;
        left?: number;
        top?: number;
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
        portals: IPortal[];
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
     * A basic wrapper for a BehaviourComment interface
     */
    export interface IBehaviourComment extends IBehaviour {
        width: number;
        height: number;
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
        originalId: number;
    }

    /**
     * A basic wrapper for a behaviour instances
     */
    export interface IBehaviourInstance extends IBehaviour {
        containerId: number;
    }

    /**
     * An interface to describe the container behaviour structure
     */
    export interface IContainer extends IBehaviour {
        name: string;
		behaviours: IBehaviour[];
		links: ILinkItem[];
		assets: number[];
		groups: number[];
		properties: {};
		plugins: {};
    }

    /**
     * Describes a runtime asset
     */
	export interface IAsset {
		name: string;
		shallowId: number;
		properties: { [name: string]: any };
		className: string;
		assets: number[];
	}

    /**
     * Describes a runtime group
     */
    export interface IGroup {
        name: string;
		shallowId: number;
        items: number[];
	}

    /**
     * Describes a runtime scene
     */
	export interface IScene {
		assets: IAsset[];
		groups: IGroup[];
		containers: IContainer[];
		converters: {};
		data: {};
	}
}
declare module HatcheryRuntime {

    /**
     * A common interface for links and behaviours
     */
    export interface IRuntimeItem {
        /**
        * Called when we enter a frame
        * @param {number} totalTime The total time from the start of the application
        * @param {number} delta The time between frames
        */
        onFrame( totalTime: number, delta: number );

        /**
        * Cleans up the object for garbage collection
        */
        dispose();

        /**
        * Notify if the item is disposed
        */
        disposed: boolean;
    }
}

declare module HatcheryRuntime {

    /**
     * Describes a plugin interface which plugin writers can implement to interact with the runtime
     */
    export interface IPlugin {

        /**
        * Called when we enter a frame
        * @param {number} totalTime The total time from the start of the application
        * @param {number} delta The time between frames
        */
        onFrame(totalTime: number, delta: number);

        /**
        * Called whenever we enter a container
        * @param {Container} container The container we are entering
        */
        onContainerEnter(container : Container );

        /**
        * Called whenever a container makes progress in its loading
        * @param {Container} container The container thats being loaded
        * @param {number} percentage The percentage of the loading processs
        */
        onLoadProgress(container: Container, percentage: number);


        /**
        * Called when a container is exited. The container might still be active.
        * @param {Container} container The container we are entering
        * @param {Portal} portal The portal used
        * @param {any} stillActive Is this container still running.
        */
        onContainerExit(container: Container, portal: Portal, stillActive: boolean);

        /**
        * Cleans up the plugin
        */
        dispose();
    }
}
declare module HatcheryRuntime {

    /**
     * This factory is used to create Animate behaviour objects
     */
    export interface IBehaviourFactory {

        /**
         * Creates a new behaviour
         * @param {any} data The data object which defines what to create
         * @param {Runtime} runtime The runtime we are adding this behaviour to
         * @returns {Behaviour} The Behaviour we have created
         */
        create( data: any, runtime: Runtime ): Behaviour;
    }

    /**
     * This factory is used to create Animate asset objects
     */
    export interface IAssetFactory {

        /**
        * Creates a new Asset
        * @param {any} data The data object which defines what to create
        * @param {Runtime} runtime The runtime we are adding this behaviour to
        * @returns {Asset} The {Asset} we have created
        */
        create(data: any, runtime: Runtime): Asset;
    }
}

declare namespace HatcheryRuntime {
    type TypedCallback<T extends string, Y> = (type: T, event: Event<T> | Y, sender?: EventDispatcher) => void;
    /**
     * Internal class only used internally by the {EventDispatcher}
     */
    class EventListener<T extends string, Y> {
        type: T;
        func: TypedCallback<T, Y>;
        context: any;
        constructor(type: T, func: TypedCallback<T, Y>, context?: any);
    }
    /**
     * The base class for all events dispatched by the {EventDispatcher}
     */
    class Event<T extends string> {
        type: T;
        tag: any;
        /**
        * Creates a new event object
        * @param {T} type The type event
        */
        constructor(type: T, tag?: any);
    }
    /**
     * A simple class that allows for the adding, removing and dispatching of events.
     */
    class EventDispatcher {
        private _listeners;
        disposed: boolean;
        constructor();
        /**
         * Returns the list of {EventListener} that are currently attached to this dispatcher.
         * @returns {Array<EventListener<string, any>>}
         */
        listeners: Array<EventListener<string, any>>;
        /**
         * Adds a new listener to the dispatcher class.
         * @param {T} type The event type we are sending
         * @param {TypedCallback<T, Y>} func The callback function
         * @param {any} context [Optional] The context to call with
         */
        on<T extends string, Y>(type: T, func: TypedCallback<T, Y>, context?: any): void;
        /**
         * Adds a new listener to the dispatcher class.
         * @param {T} type The event type we are sending
         * @param {TypedCallback<T, Y>} func The callback function
         * @param {any} context [Optional] The context to call with
         */
        off<T extends string, Y>(type: T, func: TypedCallback<T, Y>, context?: any): void;
        /**
         * Sends a message to all listeners based on the eventType provided.
         * @param {T} type The event type we are sending
         * @param {Event<T> | Y} data [Optional] The data to send with the emission
         * @returns {any}
         */
        emit<T extends string, Y>(type: T, data?: Event<T> | Y): any;
        /**
         * This will cleanup the component by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * Behaviours are objects that perform actions in an application. They are the base
     * class for all actionable tasks in Animate. Behaviours contain a list of Portals that trigger the various actions within them.
     * Each of those portals contain links that can point to and trigger other Behaviours based on the actions within.
     * You can think of Behaviours as state machines.
     */
    class Behaviour extends EventDispatcher implements IRuntimeItem {
        parameters: Portal[];
        products: Portal[];
        outputs: Portal[];
        inputs: Portal[];
        portals: Portal[];
        isActive: boolean;
        container: Container;
        runtime: Runtime;
        alias: string;
        id: number;
        constructor(runtime: Runtime);
        /**
         * Gets all links connected to this behaviour
         * @returns {Link[]}
         */
        getLinks(): Link[];
        /**
         * Clones the behaviour
         * @parameter {Behaviour} val [Optional] The child parent clone
         */
        clone(val?: Behaviour): Behaviour;
        /**
         * This will get a parameter's value by its name
         * @param {string} name The name of the parameter
         * @returns {T} the parameter's value or null
         */
        getParam<T>(name: string): T;
        /**
         * This will set a product's value by its name
         * @param {string} name The name of the product
         * @param {T} value The value of the product
         * @returns {T} the parameter's value or null
         */
        setProduct<T>(name: string, value: T): T;
        /**
         * Called after a parameter or product has been set externally.
         * @param {Portal} parameter The parameter that was set.
         */
        parameterFilled(parameter: Portal): void;
        /**
         * This function is called when the behaviour is entered by the execution context. This is where
         * all execution logic should go. The behaviour will remain active until this.exit() is called.
         * @param {string} portalName The name of the input portal we are entering through.
         * @param {Portal} portal The actual input portal we entered through
         */
        enter(portalName: string, portal: Portal): void;
        /**
         * Called after all the behaviours are loaded.
         */
        onInitialize(): void;
        /**
         * Called when we enter a frame
         * @param {number} totalTime The total time from the start of the application
         * @param {number} delta The time between frames
         */
        onFrame(totalTime: number, delta: number): void;
        /**
         * This is called when we want to deactivate the the behaviour and exit to another. This function will
         * tell a specific output portal that it has to execute its programming logic.
         * @param {string} portalName The name of the output portal to execute.
         * @param {boolean} keepActive Should calling this function turn off the behaviour
         */
        exit(portalName: string, keepActive?: boolean): void;
        /**
         * Adds a portal to this behaviour.
         * @param {PortalType} type The type of portal we are adding.
         * @param {string} name The unique name of the Portal
         * @param {any} value The default value of the Portal
         * @param {DataType} dataType The data type that the portal value represents.
         * @returns {Portal} The portal that was added to this node
         */
        addPortal(type: PortalType, name: string, value: any, dataType: DataType): Portal;
        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * The link class is used to connect portals together and pass information from one to the other.
     */
    class Link implements IRuntimeItem {
        startBehaviour: Behaviour;
        endBehaviour: Behaviour;
        startPortal: Portal;
        endPortal: Portal;
        currentFrame: number;
        frameDelay: number;
        disposed: boolean;
        id: number;
        constructor();
        /**
         * Creates a copy of the link.
         */
        clone(): Link;
        /**
         * Remove listeners
         */
        dispose(): void;
        /**
         * Called on each frame
         */
        onFrame(time: number, delta: number): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * A portal class for behaviours. There are 4 different types of portals (See PortalType). Each portal acts as a gate for a behaviour
     * and triggers some kind of action within it
     */
    class Portal extends EventDispatcher {
        name: string;
        value: any;
        links: Link[];
        type: PortalType;
        behaviour: Behaviour;
        dataType: DataType;
        /**
         * @param {string} name The name of the portal
         * @param {PortalType} type The portal type. This can be either Portal.INPUT, Portal.OUTPUT, Portal.PARAMETER or Portal.PRODUCT
         * @param {any} value The default value of the portal
         * @param {DataType} dataType The type of value this portal represents - eg: asset, string, number, file...etc
         * @param {Behaviour} behaviour The behaviour this portal is attached to
         */
        constructor(name: string, type: PortalType, value: any, dataType: DataType, behaviour: Behaviour);
        /**
         * This function will check if the source portal is an acceptable match with the current portal.
         */
        dispose(): void;
        /**
         * This function will make the portal execute its links. These may in turn trigger other portals on other behaviours
         */
        go(): void;
        /**
         * Adds a link to the portal.
         * @param {Link} link The link we are adding
         * @returns {Link}
         */
        addLink(link: Link): Link;
        /**
         * Removes a link from the portal.
         * @param {Link} link The link we are removing
         * @returns {Link}
         */
        removeLink(link: Link): Link;
    }
}
declare namespace HatcheryRuntime {
    /**
     * Assets are objects that act as model data within a scene. Typically they act within a scene, and
     * behaviours interact with them to change the state of the application
     */
    class Asset extends EventDispatcher implements IRuntimeItem {
        loaded: boolean;
        runtime: Runtime;
        instance: any;
        containerRefCount: number;
        properties: any;
        className: string;
        name: string;
        initialized: boolean;
        noLoading: boolean;
        shallowId: any;
        id: string;
        constructor(runtime: Runtime);
        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
        /**
         * Called whenever we update a frame
         * @param {number} totalTime The total time since the application loaded in MS
         * @param {number} delta The delta time  in MS
         */
        onFrame(totalTime: number, delta: number): void;
        /**
         * Loads the asset into memory
         * @param {any} instance The optional instance that this asset wraps around
         */
        load(instance?: any): void;
        /**
         * Called after everything has been loaded. This is a good function to override if your properties rely on other loaded assets.
         */
        initialize(): void;
        /**
         * Called when this asset is completed loading
         */
        loadComplete(): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * A group is an object that contains an array of scene instances
     */
    class Group extends Asset {
        assets: Asset[];
        constructor(runtime: Runtime);
        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * This factory is used to create the standard behaviours
     */
    class LiveBehaviourFactory implements IBehaviourFactory {
        /**
         * Creates a new behaviour
         * @param {any} data The data object which defines what to create
         * @param {Runtime} runtime The runtime we are adding this behaviour to
         * @returns {Behaviour} The Behaviour we have created
         */
        create(data: any, runtime: Runtime): Behaviour;
        /**
         * Creates a class from a  string
         * @param {string} str The name of the class we want to create
         * @returns {anyany | boolean} Returns the constructor function of the class or false
         */
        stringToFunction(str: string): any | boolean;
    }
}
declare namespace HatcheryRuntime {
    /**
     * A Container class contains a list of links, assets and behaviours as well as optional scene logic.
     * They are also responsible for loading, unloading and executing the contents within. Each scene needs at least 1 container in order
     * to work.
     */
    class Container extends Behaviour {
        name: string;
        behaviours: Behaviour[];
        assets: Asset[];
        groups: Group[];
        activeInstances: Behaviour[];
        properties: any;
        plugins: any;
        loaded: boolean;
        unloadOnExit: boolean;
        startOnLoad: boolean;
        private mNumLoaded;
        private mNumToLoad;
        private isLoading;
        private portalsToExecute;
        constructor(runtime: Runtime);
        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
        /**
         * Loads the asset into memory
         */
        load(): void;
        /**
         * Gets all behaviour references and their children
         * @returns {Behaviour[]}
         */
        flatten(arr?: Behaviour[]): Behaviour[];
        /**
         * Clones the behaviour
         * @parameter {Behaviour} val [Optional] The child parent clone
         * @returns {Behaviour}
         */
        clone(val?: Behaviour): Behaviour;
        /**
         * This function is called when the behaviour is entered by the Runtime. This is where
         * all execution logic should go. The behaviour will remain active until this.exit() is called.
         * @param {string} portalName The name of the input portal we are entering through.
         * @param {Portal} portal The actual input portal we entered through
         */
        enter(portalName: string, portal: Portal): void;
        /**
         * Called after a parameter / product has been set externally.
         * @param {Portal} parameter The parameter that was set.
         */
        parameterFilled(parameter: Portal): void;
        onLoaded(portalName: any, portal: any): void;
        /**
         * Called when the container needs to execute all its input portals
         */
        start(): void;
        /**
         * Called when an asset is loaded
         */
        onAssetLoaded(response: Events.AssetEvents, event: Events.IAssetEvent, sender?: EventDispatcher): void;
        /**
         * Called when all assets have completed loading
         */
        onLoadComplete(): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * This behaviour simply acts as a place holder for a container.
     */
    class InstanceBehaviour extends Behaviour {
        instance: Container;
        containerID: number;
        /**
         * @param {number} containerID The id of the container
         */
        constructor(containerID: number, runtime: Runtime);
        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
        /**
         * This function is called when the behaviour is entered by the execution context. This is where
         * all execution logic should go. The behaviour will remain active until this.exit() is called.
         * @param {string} portalName The name of the input portal we are entering through.
         * @param {Portal} portal The actual input portal we entered through
         */
        enter(portalName: string, portal: Portal): void;
        /**
         * This is called when we want to deactivate the the behaviour and exit to another. This function will
         * tell a specific output portal that it has to execute its programming logic.
         * @param {string} portalName The name of the output portal to execute.
         * @param {boolean} keepActive Should calling this function turn off the behaviour
         */
        exit(portalName: string, keepActive?: boolean): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * The Asset behaviour simply acts as a holder of variables.
     */
    class AssetBehaviour extends Behaviour {
        constructor(runtime: Runtime);
        /**
         * Clones the behaviour
         * @param {Behaviour} val [Optional] The child parent clone
         */
        clone(val?: Behaviour): Behaviour;
        /**
         * Called after a parameter has been set externally.
         * @param {Portal} parameter The parameter that was set.
         */
        parameterFilled(parameter: Portal): void;
        /**
         * Adds a portal to this behaviour.
         * @param {PortalType} type The type of portal we are adding.
         * @param {string} name The unique name of the {Portal}
         * @param {any} value The default value of the {Portal}
         * @param {DataType} dataType The data type that the portal value represents.
         * @returns {Portal} The portal that was added to this node
         */
        addPortal(type: PortalType, name: string, value: any, dataType: DataType): Portal;
    }
}
declare namespace HatcheryRuntime {
    /**
     * This singleton class is used to relay messages within the application
     */
    class Messenger extends EventDispatcher {
        private static _singleton;
        constructor();
        /**
         * Use this function to get the global {Messenger} singleton
         * @returns {Messenger}
         */
        static getSingleton(): Messenger;
    }
}
declare namespace HatcheryRuntime {
    /**
    * The Runtime class holds an Animate scene in its memory. You can play, stop and execute various
    * behaviours contained within it.
    */
    class Runtime extends EventDispatcher {
        static runtimes: Runtime[];
        static initialized: boolean;
        static activeItems: IRuntimeItem[];
        static disposables: IRuntimeItem[];
        static behaviourFactories: IBehaviourFactory[];
        static assetFactories: IAssetFactory[];
        static plugins: IPlugin[];
        static lastTime: number;
        assets: Asset[];
        containers: Container[];
        groups: Group[];
        private sceneData;
        private mNumLoaded;
        private mNumToLoad;
        private properties;
        private name;
        private frameProxy;
        id: string;
        constructor();
        /**
        * Call this to initialize the runtime variables
        */
        static initialize(): void;
        /**
         * called whenever a container makes progress in its loading
         * @param {Runtime} runtime The runtime object that contains the containner
         * @param {Container} container The container thats being loaded
         * @param {number} percentage The percentage of the loading processs
         */
        static containerLoadProgress(runtime: Runtime, container: Container, percentage: number): void;
        /**
         * Called whenever the browser wants to refresh with a new frame.
         * @param {number} time
         * @returns {any}
         */
        frame(time: number): void;
        /**
         * Returns an asset by its ID
         * @param {string} id The id of the asset
         * @param {boolean} bySceneID Should we compare the id's of the ID in the scene when it was exported or its runtime ID.
         * The default is true.
         * @returns {Asset}
         */
        getAsset(id: string, bySceneID?: boolean): Asset;
        /**
         * Returns an group by its ID
         * @param {string | number} id The id of the group
         * @param {bool} bySceneID Should we compare the id's of the ID in the scene when it was exported or its runtime ID.
         * The default is true.
         * @returns {Group}
         */
        getGroup(id: string | number, bySceneID?: boolean): Group;
        /**
         * This will cleanup the object by nullifying all its variables and clearing up all memory.
         */
        dispose(): void;
        /**
         * Use this function begin the process of loading and executing the behaviours and their assets
         */
        start(): void;
        /**
         * Called when a container has fully loaded have completed loading
         */
        onContainerLoaded(response: Events.ContainerEvents, data: Events.IContainerEvent, sender?: EventDispatcher): void;
    }
}
declare namespace HatcheryRuntime {
    /**
     * The loader class is used to load an Animate export and prepare a {Runtime} environment
     */
    class Loader extends EventDispatcher {
        constructor();
        /**
         * This function will loop through each object factory and try to create animate items based on their type.
         * @param {any} data
         * @param {Runtime} runtime The runtime we are loading
         * @returns {Behaviour}
         */
        createBehaviour(data: any, runtime: Runtime): Behaviour;
        /**
         * This function will loop through each object factory and try to create animate items based on their type.
         * @param {IAsset} assetData The asset data to use in determining what kind of asset to load
         * @param {Runtime} runtime The runtime we are loading
         * @returns {Asset}
         */
        createAsset(assetData: IAsset, runtime: Runtime): Asset;
        /**
         * This function is called when a behaviour is double clicked,
         * a canvas is created and we try and load the behavious contents.
         * @param {IScene} data The scene object we are loading
         * @returns {Runtime}
         */
        open(data: IScene): Runtime;
    }
}
