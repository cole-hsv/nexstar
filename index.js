#!/usr/bin/env node

/* eslint no-console: 0 */
'use strict';
// require('nodejs-dashboard');
// var _ = require('lodash/fp');
var moment = require('moment-timezone');
moment.tz.setDefault(moment.tz.guess());

var nexstar = require('./lib');

console.log(moment());
console.log(moment().utc());
console.log(moment.tz.guess());

/*
In the node.js intro tutorial (http://nodejs.org/), they show a basic tcp
server, but for some reason omit a client connecting to it.  I added an
example at the bottom.

Save the following server in example.js:
*/

var net = require('net');
var async = require('async');
// var pkg = require('../package.json');
var echo2server;
var count = 0;
var server = net.createServer(function (socket) {
    var id = count++;
    console.log('server connection', id, socket.bytesRead, socket.address());

    echo2server = function (buffer) {
        socket.write(buffer);
    };

    socket.on('data', function (data) {
        console.log('server socket data', id, data, nexstar.find(data));
        q.push(nexstar.unknown(data), print);
    });

    socket.on('end', function () {
        console.log('server disconnected', id);
    });
});

server.on('error', function (err) {
    console.log('server error', err);
});
server.listen(4001, '127.0.0.1');

/*
And connect with a tcp client from the command line using netcat, the *nix
utility for reading and writing across tcp/udp network connections.  I've only
used it for debugging myself.

$ netcat 127.0.0.1 1337

You should see:
> Echo server

*/

/* Or use this example tcp client written in node.js.  (Originated with
example code from
http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html.) */

var printRa = ra => nexstar.DegRaToHMSString(ra, 2);
var printDeg = dec => nexstar.DegToDmsString(dec, 2);

function print(err, task, result) {
    var formats = {
        GetRaDec: r => `RA: ${r.ra.toFixed(5)} (${printRa(r.ra)}) DEC: ${r.dec.toFixed(5)} (${printDeg(r.dec)})`,
        GetAzAlt: r => `AZ: ${r.az.toFixed(5)} (${printDeg(r.az)}) ALT: ${r.alt.toFixed(5)} (${printDeg(r.alt)})`,
        unknown: function (buffer) {
            var b = buffer.length == 0 ? Buffer.from('#') : Buffer.concat([buffer, Buffer.from('#')]);
            // console.log('pu', buffer.length, Buffer.isBuffer(buffer), b);
            if (echo2server) echo2server(b);
            return b.toString();
        }
    };
    console.log('<', task.name, err || '', formats[task.name] ? formats[task.name](result) : result);
}

// var client = new net.Socket();
var next;
var q = async.queue(function (task, callback) {
    var cmd = task.command();
    // console.log('>', task.name, task.args, Buffer.from(cmd), cmd.slice(0, 1).toString());
    client.write(cmd);
    next = function (err, buffer) {
        // console.log(task.name, err | ':', new Uint8Array(buffer), buffer.toString('hex'));
        callback(err, task, task.parse(buffer));
    };
}, 1);

q.drain = function () {
    // console.log('queue drained');
    // client.end();
};
var client = net.connect(4000, 'picam2.local', function () {
    // console.log('Connected');
    // q.push(nexstar.GetVersion(), print);
    // q.push(nexstar.GetTrackingMode(), print);
    // q.push(nexstar.IsGOTOinProgress(), print);
    // q.push(nexstar.GetModel(), print);
    q.push(nexstar.GetLocation(), print);
    q.push(nexstar.GetTime(), print);
    q.push(nexstar.RTCGetDate(), print);
    q.push(nexstar.RTCGetYear(), print);
    q.push(nexstar.RTCGetTime(), print);
    q.push(nexstar.IsGPSLinked(), print);
    // q.push(nexstar.GetAzAlt(), print);
    // q.push(nexstar.GetRaDec(), print);
    // q.push(nexstar.IsAlignmentComplete(), print);
    // q.push(nexstar.GetAutoGuideRate(), print);
    q.push(nexstar.GPSGetLatitude(), print);
    q.push(nexstar.GPSGetLongitude(), print);
    q.push(nexstar.GPSGetDate(), print);
    q.push(nexstar.GPSGetYear(), print);
    q.push(nexstar.GPSGetTime(), print);

    // q.push(nexstar.GotoRaDec(74.0644383430481, 26.444199085235596), print);
    // q.push(aux.MC_GET_VER(), print);
});

var buffers = [];
var buffer;
client.on('data', function (data) {
    buffers.push(data);
    // console.log('>', data.toString('hex'));
    if (data.includes('#')) {
        buffer = Buffer.concat(buffers);
        buffers = [];

        var hash = buffer.indexOf('#');
        // console.log('hash', buffer.slice(0, hash).toString('hex'), new Uint8Array(buffer.slice(0, hash)));
        // var a = new Uint8Array(b);
        if (next) next(undefined, buffer.slice(0, hash));
    }
});

client.on('error', function (err) {
    console.error('error', err);
});

client.on('close', function (err) {
    if (err) console.error('close error', err);
    // console.log('Connection closed', err || 'ok');
    client.unref();
    process.exit();
});

client.on('end', function (err) {
    if (err) console.error('end error', err);
    // console.log('end', err || 'ok');
    // client.destroy();
});
