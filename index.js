var debug = require('debug');

var DataUpdater = require('./lib/DataUpdater.js');
var FileDriver = require('./lib/FileDriver.js');
var UrlDriver = require('./lib/UrlDriver.js');

module.exports = {

	_debug: debug('data-updater'),

	fromFile: function(file, interval) {
		this._debug('fromFile');
		return new DataUpdater(FileDriver, file, interval);
	},

	fromUrl: function(url, interval) {
		this._debug('fromUrl');
		return new DataUpdater(UrlDriver, url, interval);
	}

};
