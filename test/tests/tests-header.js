var test = require('unit.js');
var fs = require('fs');
var yargs = require('yargs');
var args = yargs.argv;

if (!args.uconfig || !fs.existsSync(args.uconfig)) {
	console.log("Please specify a users --uconfig file to use in the command line. Eg --uconfig=\"../users/example-config.json\" ");
	process.exit();
}

if (!args.apiUrl) {
	console.log("Please specify a valid --apiUrl file to use in the command line. Eg --apiUrl=\"http://animate.webinate-test.net\"");
	process.exit();
}

// Load the files
var uconfig = fs.readFileSync(args.uconfig);
try
{
    // Parse the config files
    console.log("Parsing files...");
    uconfig = JSON.parse(uconfig);
}
catch (exp)
{
	console.log(exp.toString())
	process.exit();
}

console.log("Logged in as " + uconfig.adminUser.username);

function TestManager() {
	this.uconfig= uconfig,
	this.usersAgent = test.httpAgent("http://"+ uconfig.host +":" + uconfig.portHTTP),
	this.apiAgent = test.httpAgent(args.apiUrl),
	this.adminCookie = "",
	this.georgeCookie = "",
	this.janeCookie = "",
	this.project = null,
	this.plugin = null,
	this.totalProjects = 0,
	this.totalAssets = 0,
	this.totalContainers = 0,
	this.totalScripts = 0,
	this.totalGroups = 0,
	this.resourceId = ""
};

// Create the test manager to declare the shared variables
var testManager = new TestManager();

exports.variables = function() { return testManager; }