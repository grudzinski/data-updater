var _ = require('lodash');
var debug = require('debug');
var request = require('request');

function UrlDriver(url, updater) {
	this._debug = debug('UrlDriver');
	this._updater = updater;
	this._hasLastModified = false;
	var onReq = _.bind(this._onReq, this);
	var headers = {
		'cache-control': 'max-age=0'
	};
	var options = {
		url: url,
		json: true,
		headers: headers
	};
	this._headers = headers;
	this._request = _.partial(request, options, onReq);
}

var p = UrlDriver.prototype;

p._update = function() {
	this._debug('_start');
	this._request();
}

p._onReq = function(err, res, body) {
	this._debug('_onReq');
	var updater = this._updater;
	if (err) {
		updater._emitError(err);
		return;
	}
	var status = res.statusCode;
	if (this._hasLastModified && status === 304) {
		updater._emitOld();
		return;
	}
	if (status !== 200) {
		var err = new Error('Expeted code is 200, but got ' + status);
		updater._emitError(err);
		return;
	}
	var hasLastModified = false;
	var lastModified = res.headers['last-modified'];
	if (lastModified !== undefined) {
		this._headers['if-modified-since'] = lastModified;
		hasLastModified = true;
	} else {
		delete this._headers['if-modified-since'];
	}
	var etag = res.headers['etag'];
	if (etag !== undefined) {
		this._headers['if-none-match'] = etag;
		hasLastModified = true;
	} else {
		delete this._headers['if-none-match'];
	}
	this._hasLastModified = hasLastModified;
	updater._emitUpdate(body);
};

module.exports = UrlDriver;
