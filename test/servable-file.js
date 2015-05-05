var assert = require('assert');

var streamToString = require('stream-to-string');

var ServableFile = require('../lib/servable-file');


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

	it('must have stat', function() {
		assert(file.stat);
	});

	it('must have lastModified', function() {
		assert(file.lastModified);
	});

	it('must have contentType', function() {
		assert(file.contentType);
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

	it('must have contents', function() {
		assert(file.contents);
	});
});


// TODO: Do one for watch:true
