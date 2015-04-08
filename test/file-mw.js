var crypto = require('crypto');

var fs = require('fs');

var request = require('supertest');

var path = require('path');

var readdir = require('readdir');

var createDirectoryHandler = require('../file-mw');
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

var files = {};

readdir.readSync(FILES_DIR)
.map(function(relPath) {
	return ensureAbsolute(relPath, FILES_DIR);
})
.map(loadFilePath)
.forEach(function(file) {
	files[file.name] = file;
});



//

//var serverBuffered = createDirectoryHandler(FILES_DIR, {buffer: true});
//var serverWatched = createFileServer(FILES_DIR, {watch: true}); // TODO

describe('createFileHandler', function() { // TODO: Will we need this given other tests? or more for buffered, not, watched
	var server = createFileHandler(FILES_DIR + '/xhr.js', {watch: false, buffer: true});

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
});

describe('createDirectoryHandler(buffer: false)', function() {
	var server = createDirectoryHandler(FILES_DIR, {buffer: false});

	it('should serve index.html', function(done) {
		var file = files['index.html'];

		request(server)
			.get('/index.html')
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


xdescribe('createServer', function() {

	// TODO: Watched
	xit('should be able to get changed file contents', function(done) {
		fs.writeFileSync(filename1, 'newstuff');

		setTimeout(done, 200);
	});

	xit('should have changed contents', function(done) {
		request(testfile1.serve)
			.get('/')
			.expect('Content-Type', 'text/plain')
			.expect('Content-Length', 8)
			.expect(200)
			.end(done);
	});

	xit('should detect a deleted file', function(done) {
		fs.unlinkSync(filename1);

		setTimeout(done, 200);
	});

	xit('should return 404 for a deleted file', function(done) {
		request(testfile1.serve)
			.get('/')
			.expect(404)
			.end(done);
	});

	xit('should serve a css file with the right cache-control header', function(done) {
		request(testfile2.serve)
			.get('/')
			.expect('Content-Type', 'text/css')
			.expect('Content-Length', CONTENTS_2.length)
			.expect('Cache-Control', 'public, max-age=300')
			.expect(200)
			.end(done);
	});

	xit('should be able to get changed file contents to compressed data', function(done) {
		fs.writeFileSync(filename1, COMPRESSABLE_CONTENTS);

		setTimeout(done, 200);
	});

	xit('should send compressed contents if supported', function(done) {
		request(testfile1.serve)
			.get('/')
			.set('Accept-Encoding', 'deflate, gzip')
			.expect('Content-Type', 'text/plain')
			.expect('Content-Length', COMPRESSABLE_CONTENTS_GZIPPED_SIZE)
			.expect('Content-Encoding', 'gzip')
			.expect(200)
			.end(done);
	});

	xit('should not send compressed contents if not supported', function(done) {
		request(testfile1.serve)
			.get('/')
			.set('Accept-Encoding', null)
			.expect('Content-Type', 'text/plain')
			.expect('Content-Length', COMPRESSABLE_CONTENTS.length)
			.expect(200)
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
