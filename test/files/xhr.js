export default function xhr(opts) {
	var methodDefault = 'GET';

	opts = opts || {};

	var headers = {};

	var x = new XMLHttpRequest();

	if(opts.body) {
		methodDefault = 'POST';

		if(typeof opts.body === 'string') {
			headers['Content-Type'] = 'text/plain';
		} else {
			opts.body = JSON.stringify(opts.body);

			headers['Content-Type'] = 'application/json';
		}
	}

	if(opts.headers) {
		Object.keys(opts.headers).forEach(function(name, i) {
			headers[name] = opts.headers[name];
		});
	}

	// TODO: Move open above setrequest
	x.open(opts.method || methodDefault, opts.url, true);

	Object.keys(headers).forEach(function(name, i) {
		x.setRequestHeader(name, headers[name]);
	});

	x.send(opts.body);

	x.onerror = opts.cb;
	x.onload = function() {
		opts.cb(null, x.responseText, x.status);
	};
}
