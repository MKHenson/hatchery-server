 var header = require('./tests-header.js');
 var test = require('unit.js');

 // Get the config and agents
 var apiAgent = header.variables().apiAgent;

 describe('Testing resource related functions', function(){

  it('should not allow george to create an asset with invalid project id', function(done){
    apiAgent
        .post('/app-engine/users/george/projects/wrong_id/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name: "asset 1"})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("Please use a valid project ID")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow to create an asset when not logged in', function(done){
    apiAgent
        .post('/app-engine/users/george/projects/111111111111111111111111/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name: "asset 1"})
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("You must be logged in to make this request")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow george to create an asset with invalid project', function(done){
    apiAgent
        .post('/app-engine/users/george/projects/111111111111111111111111/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name: "asset 1"})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("No project exists with that ID")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow george to create an asset with invalid user', function(done){
    apiAgent
        .post('/app-engine/users/george2/projects/111111111111111111111111/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name: "asset 1"})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("You do not have permission")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow jane to create an asset for george\'s project', function(done){
    apiAgent
        .post('/app-engine/users/george/projects/111111111111111111111111/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name: "asset 1"})
        .set('Cookie',  header.variables().janeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("You do not have permission")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow george to create an asset with empty data', function(done) {
    apiAgent
        .post('/app-engine/users/george/projects/' + header.variables().project._id + '/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("name is required")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow george to create an asset without a shallowId', function(done) {
    apiAgent
        .post('/app-engine/users/george/projects/' + header.variables().project._id + '/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name : "chicken"})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("shallowId is required")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow george to create an asset without a className', function(done) {
    apiAgent
        .post('/app-engine/users/george/projects/' + header.variables().project._id + '/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name : "chicken", shallowId: 1})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("className is required")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should allow george to create a valid asset', function(done) {
    apiAgent
        .post('/app-engine/users/george/projects/' + header.variables().project._id + '/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .send({name: "chicken", shallowId: 1, className: "Classy"})
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);
          header.variables().resourceId = res.body.data._id;
          test.string(res.body.message).is("New resource 'chicken' created")
          test.string(res.body.data.name).is("chicken");
          test.string(res.body.data.className).is("Classy");
          test.string(res.body.data.user).is("george");
          test.object(res.body.data.json);
          test.number(res.body.data.createdOn);
          test.number(res.body.data.lastModified);
          test.number(res.body.data.shallowId).is(1);
          test.string(res.body.data._id);
          test.bool(res.body.error).isFalse()

          done(err);
        });
  }).timeout(25000)

  it('should not allow george to delete an asset with invalid id', function(done) {
    apiAgent
        .delete('/app-engine/users/george/projects/' + header.variables().project._id + '/assets/badId').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("ID 'badId' is not a valid ID")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should not allow george to delete an asset that does not exist', function(done) {
    apiAgent
        .delete('/app-engine/users/george/projects/' + header.variables().project._id + '/assets/111111111111111111111111').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("[0] resources have been removed")
          test.bool(res.body.error).isFalse()
          done(err);
        });
  }).timeout(25000)

  it('should not allow jane to delete an asset of george', function(done) {
    apiAgent
        .delete('/app-engine/users/george/projects/' + header.variables().project._id + '/assets/' + header.variables().resourceId).set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .set('Cookie',  header.variables().janeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("You do not have permission")
          test.bool(res.body.error).isTrue()
          done(err);
        });
  }).timeout(25000)

  it('should allow george to delete an asset with valid id', function(done) {
    apiAgent
        .delete('/app-engine/users/george/projects/' + header.variables().project._id + '/assets/' + header.variables().resourceId).set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
        .set('Cookie',  header.variables().georgeCookie)
        .end(function(err, res){
          if (err)
            return done(err);

          test.string(res.body.message).is("[1] resources have been removed")
          test.bool(res.body.error).isFalse()
          done(err);
        });
  }).timeout(25000)
});