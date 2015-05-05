var createRouter = require('http-router-fn');

var pathlib = require('path');

var assign = require('object-assign');

var readdir = require('readdir');

var ServableFile = require('./servable-file');

var createFileHandler = require('./file-handler');


function createDirectoryServer(dirPath, opts) {
	opts = assign({
		toUrlFormat: toUrlFormat,
		watch: false,
		buffer: false
	}, opts);

	var router = createRouter();

	dirPath = ensureAbsolute(dirPath);

	readdir.read(dirPath, function(err, filePaths) {
		if(err) {
			throw err;
		}

		filePaths.forEach(function(filePath, i) {
			var urlPath = opts.toUrlFormat(filePath);

			var file = new ServableFile(ensureAbsolute(filePath, dirPath), opts);

			var handler = createFileHandler(file);

			router.head(urlPath, handler);
			router.get(urlPath, handler);
		});
	});

	return router;
}

function ensureAbsolute(path, base) {
	if(!pathlib.isAbsolute(path)) {
		if(!base) {
			base = process.cwd();
		}

		path = pathlib.join(base, path);
	}

	return path;
}

function toUrlFormat(path) {
	if(pathlib.sep !== '/') {
		path = path.split(pathlib.sep).join('/');
	}

	if(path[0] !== '/') {
		path = '/' + path;
	}

	return path;
}


module.exports = createDirectoryServer;

createDirectoryServer.createFileHandler = function(file, opts) {
	if(typeof file === 'string') {
		file = new ServableFile(ensureAbsolute(file), opts);
	}

	return createFileHandler(file);
};

// TODO: Other ways of creating server
