'use strict';

var net = require('net');
var queue = require('async').queue;

module.exports = function(port = 4000, dest = 'localhost', cb) {
  var buffers = [];
  var buffer;
  var client = net.connect(port, dest, function() {
    if (cb) cb(sendSync);
  });
  client.on('data', function(data) {
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

  client.on('error', function(err) {
    console.error('error', err); // eslint-disable-line no-console
  });

  client.on('close', function(err) {
    if (err) console.error('close error', err); // eslint-disable-line no-console
    // console.log('Connection closed', err || 'ok');
    client.unref();
    process.exit();
  });

  client.on('end', function(err) {
    if (err) console.error('end error', err); // eslint-disable-line no-console
    // console.log('end', err || 'ok');
    // client.destroy();
  });
  
  function send(request) {
    // console.log('send', request);
    return new Promise(function(resolve, reject) {
      q.push(request, function(err, buffer, task) {
        // console.log('send q done', err, buffer);
        if (err) reject(err);
        resolve(buffer, task);
      });
    });
  }

  async function sendSync(request, fn) {
    // console.log('sendSync', request);
    try {
      var result = await send(request);
      fn(undefined, buffer, request, result);
    } catch (err) {
      if (fn) fn(err, undefined, request);
      else console.error('serial-client syncSend error', err, request);
    }
  }
  
  client.sendSync = sendSync;
  
  var next;
  var q = queue(
    function(task, callback) {
      var cmd = task.command();
      // console.log('>', task.name, task.args, Buffer.from(cmd), cmd.slice(0, 1).toString());
      client.write(cmd);
      next = function(err, buffer) {
        // console.log(task.name, err | ':', new Uint8Array(buffer), buffer.toString('hex'));
        // callback(err, task, task.parse(buffer));
        callback(err, buffer, task);
      };
    },
    1
  );

  q.drain = function() {
    // console.log('queue drained');
    // client.end();
  };

  return client;
};