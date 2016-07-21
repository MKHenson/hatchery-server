 var header = require('./tests-header.js');
 var test = require('unit.js');

 // Get the config and agents
 var apiAgent = header.variables().apiAgent;

 describe('Testing project related functions', function(){

	it('should not create a project with an empty name', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "", description: "", plugins:[] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("name cannot be empty")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should catch untrimmed names as well', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "      ", description: "", plugins:[] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("name cannot be empty")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not allowed html in names', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "<b></b>", description: "", plugins:[] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("name cannot be empty")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not allowed dangerous html in description', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project", description: "<script>hello</script><b>Hello world!</b>", plugins:[] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("'description' has html code that is not allowed")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not be allowed with no plugins', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project", description: "<b>Hello world!</b>", plugins:[] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("You must select at least 1 item for plugins")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should create a valid project', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				header.variables().project = res.body.data;
				test.string(res.body.message).is("Created project 'Test project'")
				test.bool(res.body.error).isFalse()
				test.string(res.body.data.name).is("Test project")
				test.string(res.body.data.description).is("<b>Hello world!</b>")
				test.value(res.body.data.image).is("")
				test.number(res.body.data.category).is(1)
				test.string(res.body.data.subCategory).is("")
				test.bool(res.body.data.public).isFalse()
				test.value(res.body.data.curFile).isNull()
				test.number(res.body.data.rating).is(0)
				test.bool(res.body.data.suspicious).isFalse()
				test.bool(res.body.data.deleted).isFalse()
				test.number(res.body.data.numRaters).is(0)
				test.string(res.body.data.user).is("george")
				test.string(res.body.data.build).isNot("")
				test.number(res.body.data.type).is(0)
				test.array(res.body.data.tags).isEmpty()
				test.array(res.body.data.readPrivileges).isEmpty()
				test.array(res.body.data.writePrivileges).isEmpty()
				test.array(res.body.data.adminPrivileges).isNotEmpty()
				test.array(res.body.data.plugins).isNotEmpty()
				test.array(res.body.data.files).isEmpty()
				test.number(res.body.data.createdOn).isNot(0)
				test.number(res.body.data.lastModified).isNot(0)
				test.string(res.body.data._id).notContains("00000000")

				done();
			});
	}).timeout(25000)

	it('should have a build at this point', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/' + header.variables().project._id + '/builds').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.number(res.body.count).is(1)
				test.bool(res.body.error).isFalse()
				done();
			});
	}).timeout(25000)

	it('should not get a project with a bad ID', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/123').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("Please use a valid project ID")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not get a project with a non-existant ID', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/123456789112').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("No project exists with that ID")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should get a valid project but not show sensitives unless specified', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/' + header.variables().project._id).set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("Found 1 projects")
				test.bool(res.body.error).isFalse()
				test.number(res.body.count).is(1)
				test.value(res.body.data[0].readPrivileges).isUndefined()
				done();
			});
	}).timeout(25000)

	it('should get a valid project & show sensitives when verbose', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/' + header.variables().project._id + "?verbose=true").set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("Found 1 projects")
				test.bool(res.body.error).isFalse()
				test.number(res.body.count).is(1)
				test.array(res.body.data[0].readPrivileges).isEmpty()
				done();
			});
	}).timeout(25000)

	it('should not allow a different user access to sensitive data', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/' + header.variables().project._id + "?verbose=true").set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().janeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("User does not have permissions for project")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not get a project when no user cookie is detected', function(done){
		apiAgent
			.get('/app-engine/users/george/projects/' + header.variables().project._id + "?verbose=true").set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("Please login to make this call")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not get a project for a user that doesnt exist', function(done){
		apiAgent
			.get('/app-engine/users/george3/projects/' + header.variables().project._id + "?verbose=true").set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().janeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("No project exists with that ID")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not let a another user remove a project', function(done){
		apiAgent
			.delete('/app-engine/users/george/projects/' + header.variables().project._id).set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().janeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("You don't have permission to make this request")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not let a guest remove a project', function(done){
		apiAgent
			.delete('/app-engine/users/george/projects/' + header.variables().project._id).set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("You must be logged in to make this request")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not remove an invalid project ID', function(done){
		apiAgent
			.delete('/app-engine/users/george/projects/123').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("Please use a valid project ID")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should not remove a valid project ID that doesnt exist', function(done){
		apiAgent
			.delete('/app-engine/users/george/projects/123456789112').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("No project exists with that ID")
				test.bool(res.body.error).isTrue()
				done();
			});
	}).timeout(25000)

	it('should remove a valid project', function(done){
		apiAgent
			.delete('/app-engine/users/george/projects/' + header.variables().project._id).set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("1 items have been removed")
				test.bool(res.body.error).isFalse()
				test.array(res.body.itemsRemoved).isNotEmpty()
				done();
			});
	}).timeout(25000)

	it('should create a temp project', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 1", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err)
				  return done(err);

				header.variables().project = res.body.data;
				done();
			  });
	}).timeout(25000);

	it('should allow george to get a list of projects without sensitive data', function(done) {
		apiAgent
			.get('/app-engine/users/george/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err)
				  return done(err);
				test.bool(res.body.error).isFalse()
				test.number(res.body.count).is(1)
				test.array(res.body.data).hasLength(1)
				test.string(res.body.data[0]._id).is(header.variables().project._id)
				test.value(res.body.data[0].readPrivileges).isUndefined()
				done();
			  });
	}).timeout(25000)

	it('should allow george to get a list of projects with sensitive data', function(done) {
		apiAgent
			.get('/app-engine/users/george/projects?verbose=true').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err)
				  return done(err);
 				test.bool(res.body.error).isFalse()
                test.number(res.body.count).is(1)
                test.array(res.body.data).hasLength(1)
				test.string(res.body.data[0]._id).is(header.variables().project._id)
				test.array(res.body.data[0].readPrivileges)
				done();
			  });
	}).timeout(25000)

	it('should not allow george to create 6 projects', function(done){
		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 1", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err)
				  return done(err);
			  });

		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 2", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){ if (err) return done(err); });

		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 3", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){ if (err) return done(err); });

		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 4", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){ if (err) return done(err); });

		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 5", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){ if (err) return done(err);  });

		apiAgent
			.post('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.send({name: "Test project 6", description: "<b>Hello world!</b>", plugins:["111111111111111111111111"] })
			.set('Cookie',  header.variables().georgeCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.string(res.body.message).is("You cannot create more projects on this plan. Please consider upgrading your account")
				test.bool(res.body.error).isTrue()
				done();
			});

	}).timeout(25000)

})