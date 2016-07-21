import {Model, SchemaFactory, NumberType} from "modepress-api";

/**
* A class that is used to describe the builds model
*/
export class BuildModel extends Model
{
	/**
	* Creates an instance of the model
	*/
    constructor()
    {
        super("en-builds");

        this.defaultSchema.add(new SchemaFactory.text("name", "New Build", 0));
        this.defaultSchema.add(new SchemaFactory.text("user", "", 1)).setRequired(true);
        this.defaultSchema.add(new SchemaFactory.id("projectId", "")).setRequired(true).setSensitive(true);
        this.defaultSchema.add(new SchemaFactory.text("notes", ""));
        this.defaultSchema.add(new SchemaFactory.text("version", "0.0.1"));
        this.defaultSchema.add(new SchemaFactory.html("html", "", SchemaFactory.html.defaultTags.concat("h1", "h2", "h3", "h4", "img"), SchemaFactory.html.defaultAllowedAttributes));
        this.defaultSchema.add(new SchemaFactory.bool("public", false));
        this.defaultSchema.add(new SchemaFactory.text("css", ""));
        this.defaultSchema.add(new SchemaFactory.text("liveHTML", ""));
        this.defaultSchema.add(new SchemaFactory.text("liveLink", ""));
        this.defaultSchema.add(new SchemaFactory.text("liveToken", ""));
        this.defaultSchema.add(new SchemaFactory.num("totalVotes", 0));
        this.defaultSchema.add(new SchemaFactory.num("totalVoters", 0));
        this.defaultSchema.add(new SchemaFactory.date("createdOn")).setIndexable(true);
        this.defaultSchema.add(new SchemaFactory.date("lastModified", undefined, true)).setIndexable(true);
    }
}