var _ = require('lodash');
var debug = require('debug');
var events = require('events');
var fs = require('fs');
var util = require('util');

var EventEmitter = events.EventEmitter;

function DataUpdater(dataFile, interval) {
	EventEmitter.call(this);
	this._debug = debug('DataUpdater');
	this._clearTimeout = clearTimeout;
	this._unref = false;
	this._stopped = false;
	this._firstUpdate = true;
	this._lastCtime = 0;
	this._timeoutRef = null;
	this._updating = false;
	var onReadFile = _.bind(this._onReadFile, this);
	this._readFile = _.bind(fs.readFile, fs, dataFile, onReadFile);
	var onStat = _.bind(this._onStat, this);
	this._stat = _.bind(fs.stat, fs, dataFile, onStat);
	var update = _.bind(this._update, this);
	this._updateDelayed = _.partial(setTimeout, update, interval);
}

util.inherits(DataUpdater, EventEmitter);

var p = DataUpdater.prototype;

p.start = function() {
	this._debug('start');
	this._update();
};

p.stop = function() {
	this._debug('stop');
	this._stopped = true;
	this._clearTimeout(this._timeoutRef);
};

p.ref = function() {
	this._debug('ref');
	this._unref = false;
	var timeoutRef = this._timeoutRef;
	if (timeoutRef !== null) {
		timeoutRef.ref();
	}
};

p.unref = function() {
	this._debug('unref');
	this._unref = true;
	var timeoutRef = this._timeoutRef;
	if (timeoutRef !== null) {
		timeoutRef.unref();
	}
};

p.update = function() {
	this._debug('update');
	this._clearTimeout(this._timeoutRef);
	this._update();
};

p._clearTimeout = clearTimeout;

p._parse = _.bind(JSON.parse, JSON);

p._update = function(cb) {
	this._debug('_update');
	if (this._updating) {
		return;
	}
	this._updating = true;
	this._checkStat();
};

p._checkStat = function(cb) {
	this._debug('_checkStat');
	this._stat();
};

p._onStat = function(err, stats) {
	this._debug('_onStat');
	if (err) {
		this._emitError(err);
		return;
	}
	var time = stats.ctime.getTime();
	if (this._lastCtime === time) {
		this._emitOld();
		return;
	}
	this._lastCtime = time;
	this._readFile();
};

p._emitError = function(err) {
	this._debug('_emitError');
	this._updating = false;
	this._mayBeEmitFirstUpdate(err);
	this.emit('error', err);
	this._scheduleUpdate();
};

p._emitOld = function() {
	this._debug('_emitOld');
	this._updating = false;
	this.emit('old');
	this._scheduleUpdate();
};

p._emitUpdate = function(data) {
	this._debug('_emitUpdate');
	this._updating = false;
	this._mayBeEmitFirstUpdate();
	this.emit('update', data);
	this._scheduleUpdate();
};

p._onReadFile = function(err, dataAsJson) {
	this._debug('_onReadFile');
	if (err) {
		this._emitError(err);
		return;
	}
	var data = null;
	try {
		data = this._parse(dataAsJson);
	} catch (e) {
		this._emitError(e);
		return;
	}
	this._emitUpdate(update);
};

p._scheduleUpdate = function() {
	this._debug('_scheduleUpdate');
	if (this._stopped) {
		return;
	}
	var timeoutRef = this._updateDelayed();
	if (this._unref) {
		timeoutRef.unref();
	}
	this._timeoutRef = timeoutRef;
};

p._mayBeEmitFirstUpdate = function(err) {
	this._debug('_mayBeEmitFirstUpdate');
	if (this._firstUpdate) {
		this._firstUpdate = false;
		this.emit('first-update', err);
	}
};

module.exports = DataUpdater;
