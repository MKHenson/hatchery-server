import {Model, SchemaFactory, NumberType} from "modepress-api";

/**
* A class that is used to describe the assets model
*/
export class GroupModel extends Model
{
	/**
	* Creates an instance of the model
	*/
    constructor()
    {
        super("en-groups");

        this.defaultSchema.add(new SchemaFactory.text("name", "", 1)).setRequired(true);
        this.defaultSchema.add(new SchemaFactory.num("shallowId", -1, -1, Number.MAX_VALUE, NumberType.Integer)).setRequired(true);
        this.defaultSchema.add(new SchemaFactory.id("projectId", "")).setRequired(true).setSensitive(true);
        this.defaultSchema.add(new SchemaFactory.numArray("items", [], 0, Number.MAX_VALUE, 0, Number.MAX_VALUE, NumberType.Integer));
        this.defaultSchema.add(new SchemaFactory.text("user", "", 1)).setRequired(true);
        this.defaultSchema.add(new SchemaFactory.date("createdOn")).setIndexable(true);
        this.defaultSchema.add(new SchemaFactory.date("lastModified", undefined, true)).setIndexable(true);
    }
}