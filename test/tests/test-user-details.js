var header = require( './tests-header.js' );
var test = require( 'unit.js' );

// Get the config and agents
var apiAgent = header.variables().apiAgent;

describe( 'Testing the user-details API', function() {

    it( 'should not get details of a phony user', function( done ) {
        apiAgent
            .get( '/app-engine/user-details/phony' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isTrue()
                test.string( res.body.message ).is( "Could not find details for target 'phony' : User does not exist" )
                done();
            });
    }).timeout( 25000 )

    it( 'george should have user details when he registered & they are blank', function( done ) {
        apiAgent
            .get( '/app-engine/user-details/george' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                test.string( res.body.message ).is( "Found details for user 'george'" )
                test.string( res.body.data.user ).is( "george" )
                test.string( res.body.data.bio ).is( "" )
                test.value( res.body.data.image ).is( "" )
                test.value( res.body.data.plan ).isUndefined()
                test.string( res.body.data.website ).is( "" )
                test.value( res.body.data.customerId ).isUndefined()
                test.value( res.body.data.maxProjects ).isUndefined()
                test.string( res.body.data._id )
                done();
            });
    }).timeout( 25000 )

    it( 'should allow george access his user details with verbose', function( done ) {
        apiAgent
            .get( '/app-engine/user-details/george?verbose=true' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( "Found details for user 'george'" )
                test.string( res.body.data.user ).is( "george" )
                test.string( res.body.data.bio ).is( "" )
                test.number( res.body.data.plan ).is( 1 )
                test.string( res.body.data.website ).is( "" )
                test.string( res.body.data.customerId ).is( "" )
                test.number( res.body.data.maxProjects ).is( 5 )
                test.string( res.body.data._id ).notContains( "00000000" )
                done();
            });
    }).timeout( 25000 )

    it( 'george cannot access janes details with verbose', function( done ) {
        apiAgent
            .get( '/app-engine/user-details/jane?verbose=true' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( "Found details for user 'jane'" )
                test.string( res.body.data.user ).is( "jane" )
                test.string( res.body.data.bio ).is( "" )
                test.value( res.body.data.plan ).isUndefined()
                test.string( res.body.data.website ).is( "" )
                test.value( res.body.data.customerId ).isUndefined()
                test.value( res.body.data.maxProjects ).isUndefined()
                test.string( res.body.data._id )
                done();
            });
    }).timeout( 25000 )

    it( 'should allow george update his user details', function( done ) {
        apiAgent
            .put( '/app-engine/user-details/george' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().georgeCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.string( res.body.message ).is( "Details updated" )
                done();
            });
    }).timeout( 25000 )
})