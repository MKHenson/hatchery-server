 var header = require('./tests-header.js');
 var test = require('unit.js');

 // Get the config and agents
 var apiAgent = header.variables().apiAgent;
 
 describe('Testing admin polling endpoints', function(){

	it('did get an array of projects', function(done){
		apiAgent
			.get('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().adminCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.bool(res.body.error).isFalse()
				test.number(res.body.count)
				header.variables().totalProjects = res.body.count;
				done();
			});
	}).timeout(25000)

  it('did get an array of assets', function(done){
		apiAgent
			.get('/app-engine/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().adminCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.bool(res.body.error).isFalse()
				test.number(res.body.count)
				header.variables().totalAssets = res.body.count;
				done();
			});
	}).timeout(25000)

  it('did get an array of containers', function(done){
		apiAgent
			.get('/app-engine/containers').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().adminCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.bool(res.body.error).isFalse()
				test.number(res.body.count)
				header.variables().totalContainers = res.body.count;
				done();
			});
	}).timeout(25000)

  it('did get an array of scripts', function(done){
		apiAgent
			.get('/app-engine/scripts').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().adminCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.bool(res.body.error).isFalse()
				test.number(res.body.count)
				header.variables().totalScripts = res.body.count;
				done();
			});
	}).timeout(25000)

  it('did get an array of groups', function(done){
		apiAgent
			.get('/app-engine/groups').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables().adminCookie)
			.end(function(err, res){
				if (err) return done(err);
				test.bool(res.body.error).isFalse()
				test.number(res.body.count)
				header.variables().totalGroups = res.body.count;
				done();
			});
	}).timeout(25000)

})