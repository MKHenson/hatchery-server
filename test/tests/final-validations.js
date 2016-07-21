 var header = require('./tests-header.js');
 var test = require('unit.js');

 // Get the config and agents
 var apiAgent = header.variables().apiAgent;

describe('Testing cleanup has removed all resources', function(){

	it('did remove all projects', function(done){
		apiAgent
			.get('/app-engine/projects').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie', header.variables(). adminCookie)
			.end(function(err, res){
				test.number(res.body.count)
				test.bool(header.variables().totalProjects == res.body.count).isTrue();
				done();
			});
	}).timeout(25000)

  it('did remove all scripts', function(done){
		apiAgent
			.get('/app-engine/scripts').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().adminCookie)
			.end(function(err, res){
				test.number(res.body.count)
				test.bool(header.variables().totalScripts == res.body.count).isTrue();
				done();
			});
	}).timeout(25000)

  it('did remove all containers', function(done){
		apiAgent
			.get('/app-engine/containers').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().adminCookie)
			.end(function(err, res){
				test.number(res.body.count)
				test.bool(header.variables().totalContainers == res.body.count).isTrue();
				done();
			});
	}).timeout(25000)

  it('did remove all groups', function(done){
		apiAgent
			.get('/app-engine/groups').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().adminCookie)
			.end(function(err, res){
				test.number(res.body.count)
				test.bool(header.variables().totalGroups == res.body.count).isTrue();
				done();
			});
	}).timeout(25000)

  it('did remove all assets', function(done){
		apiAgent
			.get('/app-engine/assets').set('Accept', 'application/json').expect(200).expect('Content-Type', /json/)
			.set('Cookie',  header.variables().adminCookie)
			.end(function(err, res){
				test.number(res.body.count)
				test.bool(header.variables().totalAssets == res.body.count).isTrue();
				done();
			});
	}).timeout(25000)

})