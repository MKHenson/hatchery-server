var header = require( './tests-header.js' );
var test = require( 'unit.js' );

// Get the config and agents
var usersAgent = header.variables().usersAgent;

describe( 'Creating two regular users geoge and jane', function() {

    it( 'did remove any users called george', function( done ) {
        usersAgent
            .delete( '/users/george' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                done();
            });
    }).timeout( 25000 )

    it( 'did remove any users called jane', function( done ) {
        usersAgent
            .delete( '/users/jane' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                done();
            });
    }).timeout( 25000 )

    it( 'did create regular user george', function( done ) {
        usersAgent
            .post( '/users' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { username: "george", password: "password", email: "test@test.com", privileges: 3 })
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isFalse()
                test.object( res.body ).hasProperty( "message" )
                done();
            });
    }).timeout( 16000 )

    it( 'did create another regular user jane with valid details', function( done ) {
        usersAgent
            .post( '/users' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { username: "jane", password: "password", email: "test2@test.com", privileges: 3 })
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isFalse()
                test.object( res.body ).hasProperty( "message" )
                done();
            });
    }).timeout( 16000 )

    it( 'did active george through the admin', function( done ) {
        usersAgent
            .put( '/users/george/approve-activation' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isFalse()
                done();
            });
    })

    it( 'did active jane through the admin', function( done ) {
        usersAgent
            .put( '/users/jane/approve-activation' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .set( 'Cookie', header.variables().adminCookie )
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isFalse()
                done();
            });
    })

    it( 'did get georges cookie', function( done ) {
        usersAgent
            .post( '/users/login' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { username: "george", password: "password" })
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isFalse()
                test.bool( res.body.authenticated ).isTrue()
                header.variables().georgeCookie = res.headers[ "set-cookie" ][ 0 ].split( ";" )[ 0 ];
                done();
            });
    })

    it( 'did get janes cookie', function( done ) {
        usersAgent
            .post( '/users/login' ).set( 'Accept', 'application/json' ).expect( 200 ).expect( 'Content-Type', /json/ )
            .send( { username: "jane", password: "password" })
            .end( function( err, res ) {
                if ( err ) return done( err );
                test.bool( res.body.error ).isFalse()
                test.bool( res.body.authenticated ).isTrue()
                header.variables().janeCookie = res.headers[ "set-cookie" ][ 0 ].split( ";" )[ 0 ];
                done();
            });
    })
});