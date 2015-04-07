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

## License: MIT
