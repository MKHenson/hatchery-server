import { Model, SchemaFactory, NumberType } from "modepress-api";

/**
* A class that is used to describe the assets model
*/
export class ScriptModel extends Model {
	/**
	* Creates an instance of the model
	*/
    constructor() {
        super( "en-scripts" );

        this.defaultSchema.add( new SchemaFactory.text( "name", "", 1 ) );
        this.defaultSchema.add( new SchemaFactory.num( "shallowId", -1, -1, Number.MAX_VALUE, NumberType.Integer ) ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.text( "onEnter", "" ) );
        this.defaultSchema.add( new SchemaFactory.text( "onInitialize", "" ) );
        this.defaultSchema.add( new SchemaFactory.text( "onDispose", "" ) );
        this.defaultSchema.add( new SchemaFactory.text( "onFrame", "" ) );
        this.defaultSchema.add( new SchemaFactory.id( "projectId", "" ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.text( "user", "", 1 ) );
        this.defaultSchema.add( new SchemaFactory.date( "createdOn" ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.date( "lastModified", undefined, true ) ).setIndexable( true );
    }
}