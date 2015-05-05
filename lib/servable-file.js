var crypto = require('crypto');
//var zlib = require('zlib');
var mime = require('mime');
var fs = require('fs');
var watch = require('glob-watcher');
var PassThrough = require('stream').PassThrough;


/*
A servable file MUST have the following properties:
ready - Boolean value indicating whether the file is ready to be served
contentType - Contains the MIME type of the file
lastModified - Contains the RFC1123 date of the last time the file was modified

Optional:
cacheLevel - Cache-control string
cacheSeconds - The number we put in front of max-age=
etag - ETag based on file contents
compressedContents - A gzip compressed version of the file contents
createReadStream() - Method to return stream of file contents
*/

function ServableFile(path, opts) {
	opts = opts || {};

	this.opts = opts;

	this.ready = false;

	this.path = path;

	this.contentType = mime.lookup(path);

	this.cacheLevel = opts.cacheLevel;
	this.cacheSeconds = opts.cacheSeconds;

	this.reload();

	if(opts.watch) {
		watch(path, this.reload.bind(this));
	}
}

ServableFile.prototype.reload = function() {
	var self = this;

	fs.stat(this.path, function(err, stat) {
		if(err) {
			console.log(err)
			throw err; // TODO
		}

		if(self.opts.buffer) {
			fs.readFile(self.path, function(err, contents) {
				if(err) {
					if(err.code !== 'ENOENT') {
						console.log(err)
						throw err; // TODO
					}
				}

				self.update(stat, contents);
			});
		} else {
			self.update(stat);
		}
	});
};

ServableFile.prototype.update = function(stat, contents) {
	this.stat = stat;

	if(contents) {
		this.contents = contents;

		this.createReadStream = this._createReadStreamBuffered;
	} else {
		this.createReadStream = this._createReadStream;
	}

	this._updateConditionals(stat);

	this.ready = true;
};

ServableFile.prototype._updateConditionals = function(stat) {
	this.lastModified = stat.mtime.toUTCString();

	var hash = crypto.createHash('md5');

	delete this.etag;

	var self = this;
	// TODO: Possible race condition, ensure only can be active at a time
	hash.on('finish', function() {
		process.nextTick(function() {
			self.etag = hash.read().toString('hex');
		});
	});

	this.createReadStream().pipe(hash);
};

ServableFile.prototype._createReadStream = function(opts) {
	return fs.createReadStream(this.path, opts);
};

ServableFile.prototype._createReadStreamBuffered = function(opts) {
	opts = opts || {};

	var piece = this.contents.slice(opts.start, opts.end);

	var stream = new PassThrough();

	stream.end(piece);

	return stream;
};

// TODO: Add compression later maybe
/*
ServableFile.prototype._updateCompressed = function() {
	var self = this;
	var opts = this.opts;

	// If the user didn't explicitly forbid compression
	if(opts.compress !== false) {
		// If the user asked for compression or the file is likely to be compressable
		if(opts.compress === true || isCompressableType(file.contentType)) {
			zlib.gzip(file.contents, function(err, zipped) {
				// Would the contents benefit from compression?
				if(zipped.length < (file.contents.length * 0.9)) {
					file.compressedContents = zipped;
				}
			});
		}
	}
};

function isCompressableType(type) {
	return
		type.startsWith('text/')
		|| type === 'application/javascript'
		|| type === 'application/json';
}
*/


module.exports = ServableFile;
