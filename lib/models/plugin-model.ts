import {Model, SchemaFactory, NumberType} from "modepress-api";
import {Plan} from "./user-details-model";

/**
* A class that is used to describe the plugin model
*/
export class PluginModel extends Model
{
	/**
	* Creates an instance of the model
	*/
    constructor()
    {
        super("en-plugins");

        this.defaultSchema.add(new SchemaFactory.text("name", "", 1)).setRequired(true);
        this.defaultSchema.add(new SchemaFactory.text("description", ""));
        this.defaultSchema.add(new SchemaFactory.num("plan", Plan.Free, 1));
        this.defaultSchema.add(new SchemaFactory.text("url", ""));
        this.defaultSchema.add(new SchemaFactory.textArray("deployables", []));
        this.defaultSchema.add(new SchemaFactory.text("image", ""));
        this.defaultSchema.add(new SchemaFactory.text("author", "", 1));
        this.defaultSchema.add(new SchemaFactory.text("version", "0.0.1", 1));
        this.defaultSchema.add(new SchemaFactory.date("createdOn")).setIndexable(true);
        this.defaultSchema.add(new SchemaFactory.date("lastModified", undefined, true)).setIndexable(true);
        this.defaultSchema.add(new SchemaFactory.bool("isPublic", false)).setSensitive(true);
    }
}