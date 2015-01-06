var _ = require('lodash');
var debug = require('debug');
var events = require('events');
var fs = require('fs');
var util = require('util');

var EventEmitter = events.EventEmitter;

function DataUpdater(dataFile, interval) {
	EventEmitter.call(this);
	this._debug = debug('DataUpdater');
	var onReadFile = _.bind(this._onReadFile, this);
	this._readFile = _.bind(fs.readFile, fs, dataFile, onReadFile);
	var onStat = _.bind(this._onStat, this);
	this._stat = _.bind(fs.stat, fs, dataFile, onStat);
	this._parse = _.bind(JSON.parse, JSON);
	this._lastCtime = 0;
	var update = _.bind(this._update, this);
	this._updateDelayed = _.partial(setTimeout, update, interval);
}

util.inherits(DataUpdater, EventEmitter);

var p = DataUpdater.prototype;

p.start = function() {
	this._debug('start');
	this._update();
}

p._update = function(cb) {
	this._debug('_update');
	this._checkStat();
};

p._checkStat = function(cb) {
	this._debug('_checkStat');
	this._stat();
};

p._onStat = function(err, stats) {
	this._debug('_onStat');
	if (err) {
		this.emit('error', err);
		this._scheduleUpdate();
		return;
	}
	var time = stats.ctime.getTime();
	if (this._lastCtime === time) {
		this.emit('old');
		this._scheduleUpdate();
		return;
	}
	this._lastCtime = time;
	this._readFile();
};

p._onReadFile = function(err, dataAsJson) {
	this._debug('_onReadFile');
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
	this._updateDelayed();
};

module.exports = DataUpdater;
