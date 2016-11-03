import { Model, SchemaFactory, NumberType } from 'modepress-api';

/**
* A class that is used to describe the assets model
*/
export class FileModel extends Model {
	/**
	* Creates an instance of the model
	*/
    constructor() {
        super( 'en-files' );

        this.defaultSchema.add( new SchemaFactory.text( 'name', '', 1 ) ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.text( 'bucketId', '', 1, 30 ) ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.text( 'bucketName', '', 1, 100 ) ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.num( 'size', 0, 0, Number.MAX_VALUE, NumberType.Integer ) );
        this.defaultSchema.add( new SchemaFactory.bool( 'favourite', false ) );
        this.defaultSchema.add( new SchemaFactory.bool( 'global', false ) );
        this.defaultSchema.add( new SchemaFactory.bool( 'browsable', true ) );
        this.defaultSchema.add( new SchemaFactory.text( 'user', '', 1 ) ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.text( 'identifier', '', 1, 50 ) ).setRequired( true );
        this.defaultSchema.add( new SchemaFactory.text( 'extension', '', 1 ) );
        this.defaultSchema.add( new SchemaFactory.text( 'url', '', 1, 1024 ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.textArray( 'tags', [], 0, 20, 0, 50 ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.text( 'previewUrl', '', 0, 1024 ) ).setSensitive( true );
        this.defaultSchema.add( new SchemaFactory.date( 'createdOn' ) ).setIndexable( true );
        this.defaultSchema.add( new SchemaFactory.date( 'lastModified', undefined, true ) ).setIndexable( true );
    }
}