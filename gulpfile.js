var gulp = require( 'gulp' );
var ts = require( 'gulp-typescript' );
var yargs = require( "yargs" );
var utils = require( './gulp/utils.js' );
var tslint = require( 'gulp-tslint' );

const modepressPluginDir = yargs.argv.dir || null;

if ( !modepressPluginDir )
    console.warn( "WARNING: No output directory specified." );

const tsProject = ts.createProject( 'tsconfig.json' );
const configFiles = [
    './readme.md',
    './test/package.json',
    './package.json'
];

/**
 * Builds the ts project and moves the js files to a temp directory in
 * the dist folder
 */
gulp.task( 'compile-typescript', function() {
    return tsProject.src()
        .pipe( tsProject() )
        .js
        .pipe( gulp.dest( './dist' ) );
});

/**
 * Ensures the code quality is up to scratch
 */
gulp.task( 'lint-typescript', function() {
    return tsProject.src()
        .pipe( tslint( {
            configuration: 'tslint.json',
            formatter: 'verbose'
        }) )
        .pipe( tslint.report( {
            emitError: false
        }) )
});

// Builds the definition
gulp.task( 'generate-declarations', function() {
    var tsDefinition = gulp.src( "lib/definitions/custom/hatchery-server.d.ts", { base: "lib/definitions/custom" })
        .pipe( gulp.dest( "./lib/definitions/generated" ) );
});

/**
 * Downloads the definition files used in the development of the application and moves them into the definitions folder
 */
gulp.task( 'install-definitions', function() {
    return Promise.all( [
        utils.getDefinition( "https://raw.githubusercontent.com/PixelSwarm/hatchery-runtime/dev/lib/definitions/generated/hatchery-runtime.d.ts", "lib/definitions/required/", "hatchery-runtime.d.ts" ),
        utils.getDefinition( "https://raw.githubusercontent.com/Webinate/users/dev/src/definitions/generated/users.d.ts", "lib/definitions/required/", "users.d.ts" ),
        utils.getDefinition( "https://raw.githubusercontent.com/Webinate/modepress/dev/src/definitions/generated/modepress.d.ts", "lib/definitions/required/", "modepress.d.ts" )
    ] );
});

/**
 * Copies the distribution folder contents to a modepress plugin directory
 */
gulp.task( 'copy-dist', [ 'compile-typescript', 'generate-declarations' ], function() {

    if ( !modepressPluginDir )
        return Promise.resolve();

    return gulp.src( "./dist/**", { base: "dist" })
        .pipe( gulp.dest( modepressPluginDir ) );
});

gulp.task( 'bump-patch', function() { return setup.bumpVersion( setup.bumpPatchNum, configFiles ) });
gulp.task( 'bump-minor', function() { return setup.bumpVersion( setup.bumpMidNum, configFiles ) });
gulp.task( 'bump-major', function() { return setup.bumpVersion( setup.bumpMajorNum, configFiles ) });
gulp.task( 'install', [ 'install-definitions' ] );
gulp.task( 'build', [ 'copy-dist', 'lint-typescript' ] );