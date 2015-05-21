var _ = require('lodash');
var debug = require('debug');
var fs = require('fs');

function FileDriver(dataFile, updater) {
	this._debug = debug('FileDriver');
	this._lastCtime = 0;
	this._updater = updater;
	var onReadFile = _.bind(this._onReadFile, this);
	this._readFile = _.bind(fs.readFile, fs, dataFile, onReadFile);
	var onStat = _.bind(this._onStat, this);
	this._stat = _.bind(fs.stat, fs, dataFile, onStat);
}

var p = FileDriver.prototype;

p._parse = _.bind(JSON.parse, JSON);

p._update = function(cb) {
	this._debug('_update');
	this._stat();
};

p._onStat = function(err, stats) {
	this._debug('_onStat');
	var updater = this._updater;
	if (err) {
		updater._emitError(err);
		return;
	}
	var time = stats.ctime.getTime();
	if (this._lastCtime === time) {
		updater._emitOld();
		return;
	}
	this._lastCtime = time;
	this._readFile();
};

p._onReadFile = function(err, dataAsJson) {
	this._debug('_onReadFile');
	var updater = this._updater;
	if (err) {
		updater._emitError(err);
		return;
	}
	var data = null;
	try {
		data = this._parse(dataAsJson);
	} catch (e) {
		updater._emitError(e);
		return;
	}
	updater._emitUpdate(data);
};

module.exports = FileDriver;
