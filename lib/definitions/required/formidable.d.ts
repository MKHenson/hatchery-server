

declare module "formidable"
{
	export interface IFormidableFile
	{
		/** The size of the uploaded file in bytes. If the file is still being uploaded (see 'fileBegin' event), this property says how many bytes of the file have been written to disk yet. */
		size: number;

		/** The path this file is being written to. You can modify this in the 'fileBegin' event in case you are unhappy with the way formidable generates a temporary path for your files. */
		path: string;

		/** The name this file had according to the uploading client. */
		name: string;

		/** The mime type of this file, according to the uploading client. */
		type: string;

		/** A date object (or null) containing the time this file was last written to. Mostly here for compatibility with the */
		lastModifiedDate: Date;

		/** If hash calculation was set, you can read the hex digest out of this var. */
		hash: any;

		/** This method returns a JSON-representation of the file, allowing you to JSON.stringify() the file which is useful for logging and responding to requests. */
		toJSON(): string;
	}

	export class IncomingForm
	{
		/** Creates a new incoming form. */
		encoding: string;

		/** Sets encoding for incoming form fields. */
		uploadDir: string;

		/** Sets the directory for placing file uploads in. You can move them later on using fs.rename(). The default is os.tmpDir(). */
		keepExtensions: boolean;

		/** Either 'multipart' or 'urlencoded' depending on the incoming request. */
		type: string;

		/** Limits the amount of memory a field (not file) can allocate in bytes. If this value is exceeded, an 'error' event is emitted. The default size is 2MB. (2 * 1024 * 1024) */
		maxFieldsSize: number;

		/** Limits the number of fields that the querystring parser will decode. Defaults to 1000 (0 for unlimited).*/
		maxFields: number;

		/** If you want checksums calculated for incoming files, set this to either 'sha1' or 'md5'. */
		hash: boolean;

		/** If this option is enabled, when you call form.parse, the files argument will contain arrays of files for inputs which submit multiple files using the HTML5 multiple attribute. */
		multiples: boolean;

		/**The amount of bytes received for this form so far..*/
		bytesReceived: number;

		/**The expected number of bytes in this form.*/
		bytesExpected: number;

		/**Parses an incoming node.js request containing form data. If cb is provided, all fields and files are collected and passed to the callback: */
		parse( req: any, cb?: ( err: string, fields: { [name: string]: any }, files: { [name: string]: IFormidableFile }) => void );

		/** You may overwrite this method if you are interested in directly accessing the multipart stream. Doing so will disable any 'field' / 'file' events processing which would occur otherwise, making you fully responsible for handling the processing. 
		form.onPart = function(part) {
			part.addListener('data', function() {
				// ...
			});
		}
		*/
		onPart( req: any, cb: ( part ) => void );

		/** If you want to use formidable to only handle certain parts for you, you can do so: */
		handlePart( part );



		/**
		* Emitted after each incoming chunk of data that has been parsed. Can be used to roll your own progress bar.
		*/
		on( tagName: "progress", call: ( bytesReceived: number, bytesExpected: number ) => void );

		/**
		* ?
		*/
		on( tagName: "field", call: ( name, value ) => void );

		/**
		* Emitted whenever a field / value pair has been received.
		*/
		on( tagName: "fileBegin", call: ( name: string, file: IFormidableFile ) => void );

		/**
		* Emitted whenever a new file is detected in the upload stream. Use this even if you want to stream the file to somewhere else while buffering the upload on the file system.
		* Emitted whenever a field / file pair has been received. file is an instance of File.
		*/
		on( tagName: "file", call: ( name: string, file: IFormidableFile ) => void );

		/**
		* Emitted when there is an error processing the incoming form. A request that experiences an error is automatically paused, you will have to manually call request.resume() if you want the request to continue firing 'data' events.
		*/
		on( tagName: "error", call: ( err: any ) => void );

		/**
		* Emitted when the request was aborted by the user. Right now this can be due to a 'timeout' or 'close' event on the socket. In the future there will be a separate 'timeout' event (needs a change in the node core).
		*/
		on( tagName: "aborted", call: () => void );

		/**
		* Emitted when the entire request has been received, and all contained files have finished flushing to disk. This is a great place for you to send your response.
		*/
		on( tagName: "end", call: () => void );

		on( eventName: string, a: Function );

		constructor( options?: { maxFields?: number; maxFieldsSize?: number; keepExtensions?: boolean; uploadDir?: string; encoding?: string; headers?: any; type?: any; hash?: boolean; multiples?: boolean; } );
	}
}