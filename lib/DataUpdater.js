var _ = require('lodash');
var debug = require('debug');
var events = require('events');
var fs = require('fs');
var util = require('util');

var EventEmitter = events.EventEmitter;

function DataUpdater(dataFile, interval) {
	EventEmitter.call(this);
	this._debug = debug('DataUpdater');
	this._readFile = _.bind(fs.readFile, fs, dataFile);
	this._parse = _.bind(JSON.parse, JSON);
	this._setTimeout = setTimeout;
	this._interval = interval;
	this._updateBound = _.bind(this._update, this);
}

util.inherits(DataUpdater, EventEmitter);

var p = DataUpdater.prototype;

p.start = function() {
	this._debug('start');
	this._update(_.bind(this._scheduleUpdate, this));
}

p._update = function(cb) {
	this._debug('_update');
	var onReadFile = _.bind(this._onReadFile, this);
	this._readFile(onReadFile);
	if (cb) {
		cb();
	}
};

p._onReadFile = function(err, dataAsJson) {
	this._debug('_onReadFile');
	var logger = this._logger;
	if (err) {
		this.emit('error', err);
		this._scheduleUpdate();
		return;
	}
	var data = null;
	try {
		data = this._parse(dataAsJson);
	} catch (e) {
		this.emit('error', e);
		this._scheduleUpdate();
		return;
	}
	this.emit('update', data);
	this._scheduleUpdate();
};

p._scheduleUpdate = function() {
	this._debug('_scheduleUpdate');
	this._setTimeout(this._updateBound, this._interval);
};

module.exports = DataUpdater;
