var assert = require('assert');

var streamToString = require('stream-to-string');

var ServableFile = require('../lib/models/servable-file');


var FILE_PATH = __dirname + '/files/comment.svg';
var FILE_CONTENTS = require('fs').readFileSync(FILE_PATH).toString();


describe('ServableFile', function() {
	var file;

	it('should be created but not ready', function() {
		file = new ServableFile(FILE_PATH);

		assert(!file.ready);
	});

	it('should be ready after a delay', function(done) {
		setTimeout(function() {
			assert(file.ready);

			done();
		}, 200);
	});

	it('must have cache settings', function() {
		assert(file.cache);
	});

	it('must have contentType', function() {
		assert(file.contentType);
	});

	it('must have contentLength', function() {
		assert(file.contentLength);
	});

	it('must have etag', function() {
		assert(file.etag);
	});

	it('must have lastModified', function() {
		assert(file.lastModified);
	});

	it('must have createReadStream', function(done) {
		streamToString(file.createReadStream(), function(err, contents) {
			if(err) {
				done(err);
				return;
			}

			assert.equal(contents, FILE_CONTENTS);

			done();
		});
	});
});


describe('ServableFile(buffer: true)', function() {
	var file;

	it('should be created but not ready', function() {
		file = new ServableFile(FILE_PATH, {buffer: true});

		assert(!file.ready);
	});

	it('should be ready after a delay', function(done) {
		setTimeout(function() {
			assert(file.ready);

			done();
		}, 200);
	});

	it('must have createReadStream', function(done) {
		streamToString(file.createReadStream(), function(err, contents) {
			if(err) {
				done(err);
				return;
			}

			assert.equal(contents, FILE_CONTENTS);

			done();
		});
	});
});


// TODO: Do one for watch:true
