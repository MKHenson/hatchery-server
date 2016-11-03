var header = require( './tests-header.js' );
var test = require( 'unit.js' );

// Get the config and agents
var uconfig = header.variables().uconfig;
var usersAgent = header.variables().usersAgent;



describe( 'Testing REST with admin user', function() {

    it( 'should not be logged in', function( done ) {
        usersAgent
            .get( '/logout' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isNotTrue()
                test.object( res.body ).hasProperty( "message" )
                done();
            });
    })

    it( 'should log in with a valid admin username & valid password', function( done ) {
        usersAgent
            .post( '/users/login' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { username: uconfig.adminUser.username, password: uconfig.adminUser.password })
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isNotTrue()
                test.bool( res.body.authenticated ).isTrue()
                test.object( res.body ).hasProperty( "message" )
                header.variables().adminCookie = res.headers[ "set-cookie" ][ 0 ].split( ";" )[ 0 ];
                done();
            });
    }).timeout( 25000 )
})