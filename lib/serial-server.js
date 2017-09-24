var net = require('net');
// var queue = require('async').queue;
// var pkg = require('../package.json');
//
module.exports = function(sendSync, nexstar, port = 4001, ip = '127.0.0.1', dataCallback) {
  var count = 0;
  var server = net.createServer(function(socket) {
    var req = socket.address();
    var id = `${req.address}:${req.port} (${count++})`;
    // console.log('server connection', id, socket.bytesRead, socket.address());

    socket.on('data', function(data) {
      var type = nexstar.find(data);
      sendSync(nexstar.unknown(data), function(err, buffer, task) {
        console.log('unknown', type, nexstar.unknown(data));
        socket.write(buffer);
        if (type) {
          console.log(`@${id}`, type.name, err || '', type.parse(buffer)); // eslint-disable-line no-console
          dataCallback({topic: type.name, payload: type.parse(buffer)});
        } else {
          console.log(`?${id}`, task.name, err || '', task.parse(buffer), data); // eslint-disable-line no-console
        }
      });
      // q.push(nexstar.unknown(data), print);
    });

    // socket.on('end', function () {
    //     console.log('server disconnected', id);
    // });
  });

  server.on('error', function(err) {
    console.error('server error', err);
  });
  server.listen(port, ip);

  return server;
};