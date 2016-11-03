var header = require( './tests-header.js' );
var test = require( 'unit.js' );

// Get the config and agents
var apiAgent = header.variables().apiAgent;
var uconfig = header.variables().uconfig;

describe( 'Testing plugin related functions', function() {

    it( 'should not create a plugin if not an admin', function( done ) {
        apiAgent
            .post( '/app-engine/plugins' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { name: '', description: '', plugins: [] })
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( 'You do not have permission' )
                test.bool( res.body.error ).isTrue()
                done();
            });
    }).timeout( 25000 )

    it( 'should be able to edit a plugin if not an admin', function( done ) {
        apiAgent
            .put( '/app-engine/plugins/111111111111111111111111' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { name: '', description: '', plugins: [] })
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( 'You do not have permission' )
                test.bool( res.body.error ).isTrue()
                done();
            });
    }).timeout( 25000 )

    it( 'should create a plugin if an admin', function( done ) {
        apiAgent
            .post( '/app-engine/plugins' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { name: 'Dinosaurs', description: 'This is about dinosaurs', 'versions': [ { 'version': '0.0.1', 'url': 'url' }], plugins: [ '111111111111111111111111' ] })
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                header.variables().plugin = res.body.data;
                test.string( res.body.message ).is( 'Created new plugin \'Dinosaurs\'' )
                test.bool( res.body.error ).isFalse()
                test.string( res.body.data.author ).is( uconfig.adminUser.username )
                test.string( res.body.data.description ).is( 'This is about dinosaurs' )
                test.number( res.body.data.plan ).is( 1 )
                test.array( res.body.data.deployables ).isEmpty()
                test.number( res.body.data.plan ).is( 1 )
                test.array( res.body.data.versions )
                test.number( res.body.data.versions.length ).is( 1 )
                test.string( res.body.data.versions[ 0 ].version ).is( '0.0.1' )
                test.string( res.body.data.versions[ 0 ].url ).is( 'url' )
                test.bool( res.body.data.isPublic ).isFalse()

                done();
            });
    }).timeout( 25000 )

    it( 'should not be able to get a plugin if not an admin and set to private', function( done ) {
        apiAgent
            .get( '/app-engine/plugins/' + header.variables().plugin._id ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( 'Found 0 plugins' )
                test.bool( res.body.error ).isFalse()
                done();
            });
    }).timeout( 25000 )

    it( 'should be able to get a plugin if an admin and set to private', function( done ) {
        apiAgent
            .get( '/app-engine/plugins/' + header.variables().plugin._id ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( 'Found 1 plugins' )
                test.bool( res.body.error ).isFalse()
                done();
            });
    }).timeout( 25000 )

    it( 'should not be able to delete a plugin if not an admin', function( done ) {
        apiAgent
            .delete( '/app-engine/plugins/' + header.variables().plugin._id ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( 'You do not have permission' )
                test.bool( res.body.error ).isTrue()
                done();
            });
    }).timeout( 25000 )

    it( 'should be able to delete a plugin if not an admin', function( done ) {
        apiAgent
            .delete( '/app-engine/plugins/' + header.variables().plugin._id ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( 'Plugin has been successfully removed' )
                test.bool( res.body.error ).isFalse()
                done();
            });
    }).timeout( 25000 )

});