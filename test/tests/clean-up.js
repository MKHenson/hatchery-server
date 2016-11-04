var header = require( './tests-header.js' );
var test = require( 'unit.js' );

// Get the config and agents
var usersAgent = header.variables().usersAgent;

describe( 'Cleaning up', function() {

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
})
