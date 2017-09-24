#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

var moment = require('moment-timezone');
moment.tz.setDefault(moment.tz.guess());
var nexstar = require('./lib');
var MQTT = require('async-mqtt');

var mqtt = MQTT.connect('mqtt://localhost');
mqtt.on('connect', function(value) {
  console.log('mqtt connected');
});

var printRa = ra => nexstar.degRaToHMSString(ra, 2);
var printDeg = dec => nexstar.degToDmsString(dec, 2);

var timeouts = {
  getRaDec: { timeout: 10000, last: new Date(0) }
};

async function print(err, result, task) {
  // console.log('print', err, result, task);
  try {
    if (timeouts[task.name]) timeouts[task.name].last = new Date();
    await mqtt.publish(
      `nexstar/${task.name}`,
      JSON.stringify(task.parse(result))
    );
  } catch (e) {
    // Do something about it!
    console.error('print mqtt error', e);
  }

  var formats = {
    GetRaDec: r =>
      `RA: ${r.ra.toFixed(5)} (${printRa(r.ra)}) DEC: ${r.dec.toFixed(
        5
      )} (${printDeg(r.dec)})`,
    GetAzAlt: r =>
      `AZ: ${r.az.toFixed(5)} (${printDeg(r.az)}) ALT: ${r.alt.toFixed(
        5
      )} (${printDeg(r.alt)})`,
    unknown: function(buffer) {
      var b =
        buffer.length == 0
          ? Buffer.from('#')
          : Buffer.concat([buffer, Buffer.from('#')]);
      console.log('pu', buffer.length, Buffer.isBuffer(buffer), b);
      // if (echo) echo(b);
      return b.toString();
    }
  };
  var buffer = task.parse(result);
  console.log(
    '<',
    task.name,
    err || '',
    formats[task.name] ? formats[task.name](buffer) : buffer
  );
}

var DEST = 'picam2.local';
var client = nexstar.serialClient(4000, DEST, function(sendSync) {
  console.log('connected', DEST);
  sendSync(nexstar.getVersion(), print);
  sendSync(nexstar.getModel(), print);
  sendSync(nexstar.getLocation(), print);
  sendSync(nexstar.getTime(), print);
  sendSync(nexstar.getRaDec(), print);
  sendSync(nexstar.getAzAlt(), print);
  sendSync(nexstar.getTrackingMode(), print);
  // sendSync(nexstar.gotoRaDec(82.57101813352384, -24.73080305565209), print);

  setInterval(function() {
    Object.keys(timeouts).forEach(function(key) {
      var delta = new Date() - timeouts[key].last;
      // console.log(key, timeouts[key].last, delta, timeouts[key].timeout);
      if (delta > timeouts[key].timeout) {
        // console.log('timeout', key, timeouts[key].last, delta, timeouts[key].timeout);
        sendSync(nexstar[key](), print);
      }
    });
    // sendSync(nexstar.getRaDec(), print);
  }, 1000);

  mqtt.subscribe(['nexstar/rpc/gotoRaDec']).then(function(granted) {
    console.log('mqtt granted', granted);
  });

  mqtt.on('message', function(topic, payload, packet) {
    try {
      var args = JSON.parse(payload.toString());
      var [root, type, method] = topic.split('/');
      // console.warn('nexstar.on message', topic, payload.toString(), packet, args, root, method );
      if (root === 'nexstar' && type == 'rpc') {
        console.log('**** message', root, method, args);
        sendSync(nexstar[method](...args), print);
      }
    } catch (err) {
      console.error(
        `mqtt on message error topic: ${topic} payload: ${payload.toString()}`,
        err
      );
    }
  });

  // sendSync(nexstar.getVersion()).then(r => console.log(r));
  // console.log('Connected');
  // q.push(nexstar.getVersion(), print);
  // q.push(nexstar.getTrackingMode(), print);
  // // q.push(nexstar.IsGOTOinProgress(), print);
  // q.push(nexstar.getModel(), print);
  // q.push(nexstar.getLocation(), print);
  // q.push(nexstar.getTime(), print);
  // q.push(nexstar.rtcGetDate(), print);
  // q.push(nexstar.rtcGetYear(), print);
  // q.push(nexstar.rtcGetTime(), print);
  // q.push(nexstar.isGPSLinked(), print);
  // q.push(nexstar.GetAzAlt(), print);
  // q.push(nexstar.GetRaDec(), print);
  // q.push(nexstar.IsAlignmentComplete(), print);
  // q.push(nexstar.GetAutoGuideRate(), print);
  // q.push(nexstar.gpsGetLatitude(), print);
  // q.push(nexstar.gpsGetLongitude(), print);
  // q.push(nexstar.gpsGetDate(), print);
  // q.push(nexstar.gpsGetYear(), print);
  // q.push(nexstar.gpsGetTime(), print);

  // q.push(nexstar.GotoRaDec(74.0644383430481, 26.444199085235596), print);
  // q.push(aux.MC_GET_VER(), print);
  //
});

var server = nexstar.serialServer(
  client.sendSync,
  nexstar,
  4001,
  '0.0.0.0',
  async function(data) {
    try {
      await mqtt.publish(`nexstar/${data.topic}`, JSON.stringify(data.payload));
    } catch (e) {
      // Do something about it!
      console.error('mqtt error', e);
    }
  }
); // eslint-disable-line
