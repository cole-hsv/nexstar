'use strict';
require('nodejs-dashboard');
var _ = require('lodash/fp');
var moment = require('moment-timezone');
moment.tz.setDefault(moment.tz.guess());

var nexstar = require('./nexstar.js');

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
// var server = net.createServer(function (socket) {
//     socket.write('Echo server\r\n');
//     // socket.pipe(socket);
// });
//
// server.listen(4001, '127.0.0.1');
// var count = 0;
// server.on('connection', function (socket) {
//     count++;
//     socket.on('data', function (data) {
//         console.log('server socket data', data);
//     });
//     console.log('server connection');
// });


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


function print(err, task, result) {
    console.log(task.name, task.command, err || '', result);
}

// var client = new net.Socket();
var next;
var q = async.queue(function (task, callback) {
    // console.log('sending', task.name, task.command);
    client.write(task.command);
    next = function (err, buffer) {
        // console.log('next', err, buffer);
        callback(err, task, task.parse(buffer));
    };
}, 1);

q.drain = function () {
    // console.log('queue drained');
    client.end();
};
var client = net.connect(4000, 'picam.local', function () {
    // console.log('Connected');
    q.push(nexstar.GetVersion, print);
    q.push(nexstar.GetTrackingMode, print);
    q.push(nexstar.IsGOTOinProgress, print);
    q.push(nexstar.GetModel, print);
    q.push(nexstar.GetLocation, print);
    q.push(nexstar.GetTime, print);
    // // q.push(nexstar.RTCGetDate, print);
    // // q.push(nexstar.RTCGetYear, print);
    // // q.push(nexstar.RTCGetTime, print);
    // // q.push(nexstar.IsGPSLinked, print);
    q.push(nexstar.GetAzAlt, print);
    q.push(nexstar.GetRaDec, print);
    // q.push(nexstar.IsAlignmentComplete, print);
    q.push(nexstar.GetAutoGuideRate, print);
    // q.push(aux.MC_GET_VER, print);
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
        // console.log('hash', buffer.slice(0, hash).toString('hex'), hash);
        // var a = new Uint8Array(b);
        if (next) next(undefined, buffer.slice(0, hash));
    }
});

client.on('error', function (err) {
    console.error('error', err);
});

client.on('close', function (err) {
    // console.log('Connection closed', err || 'ok');
    client.unref();
    process.exit();
});

client.on('end', function (err) {
    // console.log('end', err || 'ok');
    // client.destroy();
});
