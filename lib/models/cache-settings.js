function CacheSettings(opts) {
	this.level = opts.cacheLevel || 'no-store';

	this.seconds = opts.cacheSeconds || undefined;
}


module.exports = CacheSettings;
