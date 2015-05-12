function createFileHandler(file) {
	var handler = function(req, res) {
		if(!file.ready) {
			return false;
		}

		//res.setHeader('Vary', 'Accept-Encoding'); // TODO: Add when we add compression back
		res.setHeader('Content-Type', file.contentType);

		var handled = handleConditionals(file, req, res);

		if(handled) {
			return true;
		}

		addCacheHeaders(file, req, res);

		// TODO range
		res.setHeader('Content-Length', file.contentLength);

		switch(req.method) {
		case 'HEAD':
			res.end();
			break;

		case 'GET':
			file.createReadStream().pipe(res);
			break;

		default:
			// Other methods are not allowed
			res.writeHead(405, {Allow: 'GET, HEAD'});
			res.end('Method Not Allowed');
		}

		return true;
	};

	return function(req, res) {
		if(!handler(req, res)) {
			setTimeout(function() {
				if(!handler(req, res)) {
					setTimeout(function() {
						if(!handler(req, res)) {
							res.writeHead(404);
							res.end('Unable to serve file');
						}
					}, 1000);
				}
			}, 200);
		}
	};
}


function handleConditionals(file, req, res) {
	// Add etag header if we have it
	if(file.etag) {
		res.setHeader('ETag', file.etag);

		// If the browser already has this file based on etag match
		if(req.headers['if-none-match'] === file.etag) {
			res.writeHead(304);
			res.end();

			return true;
		}
	}

	if(req.headers['if-modified-since'] === file.lastModified) {
		res.writeHead(304);
		res.end();

		return true;
	}

	return false;
}

function addCacheHeaders(file, req, res) {
	// If we want the browser to cache a resource for a while
	if(file.cache.seconds !== undefined) {
		res.setHeader('Cache-Control', file.cache.level + ', max-age=' + file.cache.seconds);
	}

	res.setHeader('Last-Modified', file.lastModified);
}


// TODO: For compression
/*
require('es6string');

function pickBody(file, req, res) {
	var body = file.contents;

	// Only bother if we have compressed contents to serve
	if(file.compressedContents) {
		var acceptEncoding = req.headers['accept-encoding'];

		// Header is present and browser supports gzipped payloads
		if(acceptEncoding && acceptEncoding.includes('gzip')) {
			// Serve compressed file contents instead
			body = files.compressedContents;

			// Tell the browser we're sending a compressed body
			res.setHeader('Content-Encoding', 'gzip');
		}
	}

	return body;
}
*/


// TODO: Integrate this later
//var rangeParser = require('range-parser');
//var MultipartStream = require('multipart-stream');

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

/*
Options:
url - url to serve from
type - Content type
*/
/*
function parseRangeHeader(rangeHeader, contentSize) {
	var range = rangeParser(contentSize, rangeHeader || '');

	// In case of error, return null
	if(range.type !== 'bytes') {
		return null;
	}

	// Filter out invalid ranges
	var ranges = range.filter(function(r) {
		return (r.end <= (contentSize - 1));
	});

	return ranges;
}

function createRangeResponse(filepath, contentType, ranges) {
	if(ranges.length === 1) {
		return fs.createReadStream(filepath, {
			start: ranges[0].start,
			end: ranges[0].end
		});
	} else {
		var byterangesStream = new MultipartStream(boundary);

		ranges.forEach(function(range) {
			var start = range.start;
			var end = range.end;

			byterangesStream.addPart({
				headers: {
					'Content-Type': contentType,
					'Content-Range': 'bytes ' + start + '-' + end + '/*'
				},
				body: createLazyFileReadStream(filepath, {start: start, end: end})
			});
		});

		return byterangesStream;
	}
}
*/


module.exports = createFileHandler;
