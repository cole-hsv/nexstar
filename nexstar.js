'use strict';

var protocol = require('./protocol.js');
var moment = require('moment-timezone');

var nexstar = protocol();


nexstar.add('GetTrackingMode', 't', function (b) {
    var modes = {
        0: 'Off',
        1: 'Alt/Az',
        2: 'EQ North',
        3: 'EQ South'
    };

    return modes[b[0]];
});
nexstar.add('GetModel', 'm');
nexstar.add('GetVersion', 'V', b => `${b[0]}.${b[1]}`);
// nexstar.add('Echo', 'K');
nexstar.add('IsAlignmentComplete', 'J');
nexstar.add('IsGOTOinProgress', 'L');
nexstar.add('CancelGOTO', 'M');
nexstar.add('GetLocation', 'w', function (a) {
    return {
        lat: a[0] + (a[1] / 60) + (a[2] / 3600) * (a[3] == 1 ? -1 : 1),
        lon: a[4] + (a[5] / 60) + (a[6] / 3600) * (a[7] == 1 ? -1 : 1)
    };
});
nexstar.add('GetTime', 'h', function (a) {
    // The format of the time commands is: QRSTUVWX, where:
    // Q [0] is the hour (24 hour clock).
    // R [1] is the minutes.
    // S [2] is the seconds.
    // T [3] is the month.
    // U [4] is the day.
    // V [5] is the year (century assumed as 20).
    // W [6] is the offset from GMT for the time zone. Note: if zone is negative, use 256-zone.
    // X [7] is 1 to enable Daylight Savings and 0 for Standard Time.

    // [ 11, 2, 15, 12, 11, 16, 250, 0 ] 2016-12-11T11:02:13.299-06:00
    var zone = (a[6] > 128 ? a[6] - 256 : a[6]) + a[7];
    var d = [2000 + a[5], a[3] - 1, a[4], a[0], a[1], a[2]];
    // console.log('a', a, zone, d);
    return moment.utc(d).add(-zone, 'hours');
});

nexstar.add('IsGPSLinked', ['P', 1, 176, 55, 0, 0, 0, 1]);

nexstar.add('RTCGetDate', ['P', 1, 178, 3, 0, 0, 0, 2], function (b) {
    return `${b[0]}/${b[1]}`;
});
nexstar.add('RTCGetYear', ['P', 1, 178, 4, 0, 0, 0, 2], function (b) {
    return (b[0] * 256) + b[1];
});
nexstar.add('RTCGetTime', ['P', 1, 178, 51, 0, 0, 0, 3], function (b) {
    return b.join(':');
});

nexstar.add('GetAutoGuideRate', ['P', 1, 16, 0x47, 0, 0, 0, 1], function (b) {
    // console.log('b', b);
    return 100 * b[0] / 256;
});

// const REVOLUTION = 65536;
const HIGHPRECISIONREV = 4294967296;

function parseHPPosition(b, names) {
    var value = [(b.readUInt32BE(0) / HIGHPRECISIONREV) * 360,
        (b.readUInt32BE(4) / HIGHPRECISIONREV) * 360
    ];

    var result = {};
    result[names[0]] = value[0];
    result[names[1]] = value[1];
    return result;
}

nexstar.add('GetRaDec', 'e', {
    buffer: true
}, function (b) {
    return parseHPPosition(b, ['ra', 'dec']);
});

nexstar.add('GetAzAlt', 'z', {
    buffer: true
}, function (b) {
    return parseHPPosition(b, ['az', 'alt']);
});

module.exports = nexstar;
