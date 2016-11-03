import { Model, SchemaFactory, NumberType } from 'modepress-api';

/**
* A class that is used to describe the project model
*/
export class ProjectModel extends Model {
	/**
	* Creates an instance of the model
	*/
    constructor() {
        super( 'en-projects' );

        this.defaultSchema.add( new SchemaFactory.text( 'name', '', 1 ) ).setIndexable( true ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.html( 'description', '' ) );
        this.defaultSchema.add( new SchemaFactory.text( 'image', '' ) );
        this.defaultSchema.add( new SchemaFactory.num( 'category', 1, 1 ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.text( 'subCategory', '' ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.bool( 'public', false ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.id( 'curFile', '' ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.num( 'rating', 0 ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.num( 'score', 0 ) );
        this.defaultSchema.add( new SchemaFactory.num( 'numRaters', 0 ) );
        this.defaultSchema.add( new SchemaFactory.bool( 'suspicious', false ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.bool( 'deleted', false ) );
        this.defaultSchema.add( new SchemaFactory.text( 'user', '', 1 ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.id( 'build', '' ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.num( 'type', 0 ) );
        this.defaultSchema.add( new SchemaFactory.textArray( 'tags', [] ) );
        this.defaultSchema.add( new SchemaFactory.textArray( 'readPrivileges', [] ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.textArray( 'writePrivileges', [] ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.textArray( 'adminPrivileges', [] ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.idArray( 'plugins', [], 1 ) );
        this.defaultSchema.add( new SchemaFactory.textArray( 'files', [] ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.date( 'createdOn' ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.date( 'lastModified', undefined, true ) ).setIndexable( true );
    }
}