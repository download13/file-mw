var crypto = require('crypto');

var fs = require('fs');

var request = require('supertest');

var path = require('path');

var readdir = require('readdir');

var createDirectoryHandler = require('../lib/file-mw');
var createFileHandler = createDirectoryHandler.createFileHandler;

// TODO
/*
    Accept-Ranges // Done
    Range // Done
    Content-Range
    If-Range

Also note possible changes to logic for:

    If-Modified-Since
    If-Unmodified-Since
    If-Match
    If-None-Match

*/

// TODO: Test range requests
// TODO: Test range cached requests
// bytes=-500
// bytes=9500-
// bytes=0-0,-1
// bytes=500-600,601-999
// TODO: Should send back error is ranges count if greater than 10 or some ranges overlap


// TODO: Tests, single file, blob of multiple, multiple blobs, directory, blob of dirs, blob or dirs and files

var FILES_DIR = __dirname + '/files';

fs.writeFileSync(FILES_DIR + '/changeable.txt', 'something different');

var files = {};

readdir.readSync(FILES_DIR)
.map(function(relPath) {
	return ensureAbsolute(relPath, FILES_DIR);
})
.map(loadFilePath)
.forEach(function(file) {
	files[file.name] = file;
});



//var serverBuffered = createDirectoryHandler(FILES_DIR, {buffer: true});
//var serverWatched = createFileServer(FILES_DIR, {watch: true}); // TODO

describe('createFileHandler', function() { // TODO: Will we need this given other tests? or more for buffered, not, watched
	describe('#watch:false', function() {
		var server;

		it('should be created without errors', function() {
			server = createFileHandler(FILES_DIR + '/xhr.js', {watch: false, buffer: true});
		});

		it('should send a javascript file', function(done) {
			var file = files['xhr.js'];

			request(server)
				.get('/xhr.js/fd')
				.expect('Content-Type', 'application/javascript')
				.expect('Content-Length', file.stat.size)
				.expect('Last-Modified', file.stat.mtime.toUTCString())
				.expect(200)
				.end(done);
		});

		// TODO: test that it won't update when changed
	});

	describe('#watch:true', function() {
		var server;

		var file = files['changeable.txt'];

		it('should be created without errors', function() {
			server = createFileHandler(FILES_DIR + '/changeable.txt', {watch: true});
		});

		it('should be able to get changed file contents', function(done) {
			fs.writeFileSync(file.path, 'newstuff');

			setTimeout(done, 500);
		});

		it('should have changed contents', function(done) {
			request(server)
				.get('/changeable.txt')
				.expect('Content-Type', 'text/plain')
				.expect(200, 'newstuff')
				.end(function(err) {
					fs.writeFileSync(file.path, 'something different');

					done(err);
				});
		});
	});
});

describe('createDirectoryHandler(buffer: false)', function() {
	var server = createDirectoryHandler(FILES_DIR, {buffer: false, cacheLevel: 'public', cacheSeconds: '30'});

	it('should serve index.html', function(done) {
		var file = files['index.html'];

		request(server)
			.get('/index.html')
			.expect('Cache-Control', 'public, max-age=30')
			.expect('Content-Type', 'text/html')
			.expect('Content-Length', file.stat.size)
			.expect('Last-Modified', file.stat.mtime.toUTCString())
			.expect(200)
			.end(done);
	});

	it('should serve a css file', function(done) {
		var file = files['style.css'];

		request(server)
			.get('/style.css')
			.expect('Content-Type', 'text/css')
			.expect('Content-Length', file.stat.size)
			.expect('Last-Modified', file.stat.mtime.toUTCString())
			.expect(200)
			.end(done);
	});

	it('should serve an svg file', function(done) {
		var file = files['comment.svg'];

		request(server)
			.get('/comment.svg')
			.expect('Content-Type', 'image/svg+xml')
			.expect('Content-Length', file.stat.size)
			.expect('Last-Modified', file.stat.mtime.toUTCString())
			.expect(200)
			.end(done);
	});

	it('should send 304 on matching last modified conditional request', function(done) {
		var file = files['index.html'];
		var modified = file.stat.mtime.toUTCString();

		request(server)
			.get('/index.html')
			.set('If-Modified-Since', modified)
			.expect('Content-Type', 'text/html')
			.expect(304)
			.end(done);
	});

	it('should send 200 on non-matching last modified conditional request', function(done) {
		var file = files['index.html'];
		var modified = new Date(file.stat.mtime.getTime() + 5000).toUTCString();

		request(server)
			.get('/index.html')
			.set('If-Modified-Since', modified)
			.expect('Content-Type', 'text/html')
			.expect('Content-Length', file.stat.size)
			.expect('Last-Modified', file.stat.mtime.toUTCString())
			.expect(200)
			.end(done);
	});

	it('should send 304 on matching etag conditional request', function(done) {
		var file = files['index.html'];
		var etag = crypto.createHash('md5').update(file.contents).digest('hex');

		request(server)
			.get('/index.html')
			.set('If-None-Match', etag)
			.expect('Content-Type', 'text/html')
			.expect(304)
			.end(done);
	});

	it('should send 200 on non-matching etag conditional request', function(done) {
		var file = files['index.html'];

		request(server)
			.get('/index.html')
			.set('If-None-Match', 'somerandomnotetagdata')
			.expect('Content-Type', 'text/html')
			.expect('Content-Length', file.stat.size)
			.expect('Last-Modified', file.stat.mtime.toUTCString())
			.expect(200)
			.end(done);
	});

	it('should not include a body for a HEAD request', function(done) {
		request(server)
			.head('/index.html')
			.expect('Content-Type', 'text/html')
			// TODO: range head request
			.expect(200)
			.expect('')
			.end(done);
	});
});


function loadFilePath(filePath) {
	return {
		path: filePath,
		name: path.basename(filePath),
		stat: fs.statSync(filePath),
		contents: fs.readFileSync(filePath).toString()
	};
}

function ensureAbsolute(aPath, base) {
	if(!path.isAbsolute(aPath)) {
		if(!base) {
			base = process.cwd();
		}

		aPath = path.join(base, aPath);
	}

	return aPath;
}
