var _ = require('lodash');
var debug = require('debug');
var events = require('events');

var EventEmitter = events.EventEmitter;

function DataUpdater(driverConstructor, driverOptions, interval) {
	EventEmitter.call(this);
	this._debug = debug('DataUpdater');
	this._driverConstructor = driverConstructor;
	this._driverOptions = driverOptions;
	this._driver = null;
	this._unref = false;
	this._stopped = false;
	this._firstUpdate = true;
	this._firstSuccessfulUpdate = true;
	this._timeoutRef = null;
	this._updating = false;
	var update = _.bind(this._update, this);
	this._updateDelayed = _.partial(setTimeout, update, interval);
}

var p = Object.create(EventEmitter.prototype);

DataUpdater.prototype = p;

p.start = function(cb) {
	this._debug('start');
	this._driver = new this._driverConstructor(this._driverOptions, this);
	if (cb !== undefined) {
		this.once('first-successful-update', cb);
	}
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
	this._driver._update();
};

p._emitError = function(err) {
	this._debug('_emitError');
	this._updating = false;
	this.emit('error', err);
	this._mayBeEmitFirstUpdate(err);
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
	this.emit('update', data);
	this._mayBeEmitFirstUpdate(null);
	this._scheduleUpdate();
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
	if (!err && this._firstSuccessfulUpdate) {
		this._firstSuccessfulUpdate = false;
		this.emit('first-successful-update');
	}
};

module.exports = DataUpdater;
