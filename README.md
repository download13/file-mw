# file-mw

File serving middleware

## Install:
	npm i file-mw

## Example:
```javascript
var http = require('http');
var fileMw = require('file-mw');


http.createServer(fileMw('publicDirectoryName')).listen(80);
```

## API:
* fileMw(directoryPath, options) - Creates a handler that serves files from a directory
* fileMw.createFileHandler(filePath, options) - Creates handler that serves one file when called

The `options` object can have the following properties:
* cacheLevel - `optional`; Can be 'no-cache', 'public', 'private', or any valid value for the `Cache-Control` header.
* cacheSeconds - `optional`; The value appended to 'max-age=' in the `Cache-Control` header.
* buffer - `default false`; If true the file contents should be buffered into memory instead of being streamed from the filesystem.
* watch - `default false`; If true the file will be watched for changes and the updated file will be served.

## License: MIT
