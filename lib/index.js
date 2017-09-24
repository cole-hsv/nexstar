'use strict';

var nexstar = require('./nexstar.js');
var sexa = require('./sexagesimal.js');
var serialServer = require('./serial-server.js');
var serialClient = require('./serial-client.js');

module.exports = Object.assign({serialServer, serialClient}, nexstar, sexa);