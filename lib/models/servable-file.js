var crypto = require('crypto');

//var zlib = require('zlib');

var mime = require('mime');

var fs = require('fs');

var watch = require('glob-watcher');

var PassThrough = require('stream').PassThrough;

var CacheSettings = require('./cache-settings');


/*
Options:
cacheLevel - Cache-control string
cacheSeconds - The number we put in front of max-age=
watch - Watch the file for changes and reload
buffer - Buffer file contents in memory to speed up serving


Public interface:
ready - boolean; Indicates whether the file is ready to serve
cache - CacheSettings object keeping track of Cache-Control headers
contentType - Mime type of file
contentLength - Length in bytes of file contents
etag - Etag for file
lastModified - Last modified time and date in ISO 8601 format
createReadStream() - Method to return stream of file contents
*/

function ServableFile(path, opts) {
	opts = opts || {};

	this._bufferContents = opts.buffer;

	this._filePath = path;


	this.ready = false;

	this.cache = new CacheSettings(opts);

	this.contentType = mime.lookup(path);


	this.reload();

	if(opts.watch) {
		watch(path, this.reload.bind(this));
	}
}

ServableFile.prototype.reload = function() {
	var self = this;

	fs.stat(self._filePath, function(err, stat) {
		if(err) {
			if(err.code === 'ENOENT') {
				return self._disableServing();
			} else {
				throw err;
			}
		}

		if(self._bufferContents) {
			fs.readFile(self._filePath, function(err, contents) {
				if(err) {
					if(err.code === 'ENOENT') {
						return self._disableServing();
					} else {
						throw err;
					}
				}

				self._enableServing(stat, contents);
			});
		} else {
			self._enableServing(stat);
		}
	});
};

ServableFile.prototype._enableServing = function(stat, contents) {
	this.contentLength = stat.size;

	if(contents) {
		this._contents = contents;

		this.createReadStream = this._createReadStreamBuffered;
	} else {
		this.createReadStream = this._createReadStream;
	}

	this._updateConditionals(stat);

	this.ready = true;
};

ServableFile.prototype._disableServing = function() {
	this.ready = false;
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
	return fs.createReadStream(this._filePath, opts);
};

ServableFile.prototype._createReadStreamBuffered = function(opts) {
	opts = opts || {};

	var piece = this._contents.slice(opts.start, opts.end);

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
