'use strict';

var protocol = require('./protocol.js');
var moment = require('moment-timezone');
// var _ = require('lodash/fp');
var nexstar = protocol();

var integer2boolean = function parseTrueFalse(buffer) {
    // console.log('parseTrueFalse', buffer[0].toString())
    return buffer[0] != 0;
};

var string2Boolean = function parseTrueFalse(buffer) {
    // console.log('parseTrueFalse', buffer[0].toString())
    return buffer[0] != 48;
};

// const REVOLUTION = 65536;
// const HIGHPRECISIONREV = 4294967296;

const LOWPRECISION = {
    rev: 65536,
    len: 4
};

const HIGHPRECISION = {
    rev: 4294967296,
    len: 8
};

nexstar.HIGHPRECISION = HIGHPRECISION;
nexstar.LOWPRECISION = LOWPRECISION;

nexstar.parsePosition = function parsePosition(buffer, names, precision) {
    var str = buffer.toString();
    var a = str.substr(0, precision.len);
    var b = str.substr(precision.len + 1, precision.len);

    var value = [(parseInt(a, 16) / precision.rev) * 360,
        (parseInt(b, 16) / precision.rev) * 360
    ];

    var result = {};
    result[names[0]] = value[0];
    result[names[1]] = value[1];
    return result;
};

const pad8 = '00000000';

function dd2str(n, precision) {
    var perRev = (n / 360) * precision.rev;
    var s = perRev.toString(16).toUpperCase();
    var period = s.indexOf('.');
    // console.log('dd2str', s, period, period != -1 ? s.substr(0, period) : '');
    if (period != -1) s = s.substr(0, period);
    // console.log('dd2str', n, s);
    return s.length == precision.len ? s : pad8.slice(0, precision.len - s.length) + s;
}

nexstar.toPosition = function toPosition(args, precision) {
    return args.map(x => dd2str(x, precision)).join(',');
};


/***********************************
  Nextar Hand Controller Protocol
***********************************/

nexstar.add('GetRaDecLo', 'E', {
    buffer: true
}, function (b) {
    return nexstar.parsePosition(b, ['ra', 'dec'], LOWPRECISION);
});

nexstar.add('GetRaDec', 'e', {
    buffer: true
}, function (b) {
    return nexstar.parsePosition(b, ['ra', 'dec'], HIGHPRECISION);
});

nexstar.add('GetAzAltLo', 'Z', {
    buffer: true
}, function (b) {
    return nexstar.parsePosition(b, ['az', 'alt'], LOWPRECISION);
});

nexstar.add('GetAzAlt', 'z', {
    buffer: true
}, function (b) {
    return nexstar.parsePosition(b, ['az', 'alt'], HIGHPRECISION);
});

nexstar.add('GotoRaDec', function command(args) {
    var position = nexstar.toPosition(args, HIGHPRECISION);
    return Buffer.from('r' + position);
});

nexstar.add('GotoRaDecLo', function command(args) {
    var position = nexstar.toPosition(args, LOWPRECISION);
    return Buffer.from('R' + position);
});

nexstar.add('GotoAzAlt', function command(args) {
    var position = nexstar.toPosition(args, HIGHPRECISION);
    return Buffer.from('b' + position);
});

nexstar.add('GotoAzAltLo', function command(args) {
    var position = nexstar.toPosition(args, LOWPRECISION);
    return Buffer.from('B' + position);
});

nexstar.add('SyncRaDec', function command(args) {
    var position = nexstar.toPosition(args, HIGHPRECISION);
    return Buffer.from('s' + position);
});

nexstar.add('SyncRaDecLo', function command(args) {
    var position = nexstar.toPosition(args, LOWPRECISION);
    return Buffer.from('S' + position);
});


const trackingModes = {
    0: 'Off',
    1: 'Alt/Az',
    2: 'EQ North',
    3: 'EQ South'
};

nexstar.trackingModes = trackingModes;

nexstar.add('GetTrackingMode', 't', function (b) {
    return trackingModes[b[0]];
});

nexstar.add('SetTrackingMode', function command(args) {
    return Buffer.from(['T'.charCodeAt(0), args[0]]);
});

var slewModes = {
    'az+': {
        axis: 16,
        direction: 6,
        fixedDirection: 36
    },
    'az-': {
        axis: 16,
        direction: 7,
        fixedDirection: 37
    },
    'alt+': {
        axis: 17,
        direction: 6,
        fixedDirection: 36
    },
    'alt-': {
        axis: 17,
        direction: 7,
        fixedDirection: 37
    }
};

var slewAlias = {
    'az+': 'az+',
    'az-': 'az-',
    'ra+': 'az+',
    'ra-': 'az-',
    'alt+': 'alt+',
    'alt-': 'alt-',
    'dec+': 'alt+',
    'dec-': 'alt-'
};

function slew(mode, rate) {
    var r = rate * 4;
    return Buffer.from([80, 3, slewModes[mode].axis, slewModes[mode].direction, r / 256 | 0, r % 256, 0, 0]);
}

nexstar.add('Slew', function command(args) {
    var [mode, rate] = args;
    return slew(slewAlias[mode], rate);
});

nexstar.add('SlewFixed', function command(args) {
    var [alias, rate] = args;
    var mode = slewAlias[alias];
    return Buffer.from([80, 2, slewModes[mode].axis, slewModes[mode].fixedDirection, rate, 0, 0, 0]);
});


/**
 * Time/Location Commands (Hand Controller)
 */

nexstar.add('GetLocation', 'w', function (a) {
    return {
        lat: a[0] + (a[1] / 60) + (a[2] / 3600) * (a[3] == 1 ? -1 : 1),
        lon: a[4] + (a[5] / 60) + (a[6] / 3600) * (a[7] == 1 ? -1 : 1)
    };
});

nexstar.add('SetLocation', function command(args) {
    var [alias, rate] = args;
    var mode = slewAlias[alias];
    return Buffer.from(['W'.charCodeAt(0), 0, 0, 0, 0, 0, 0, 0]);
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

nexstar.add('GetModel', 'm');
nexstar.add('GetVersion', 'V', b => `${b[0]}.${b[1]}`);
// nexstar.add('Echo', 'K');
nexstar.add('IsAlignmentComplete', 'J', integer2boolean);
nexstar.add('IsGOTOinProgress', 'L', string2Boolean);
nexstar.add('CancelGOTO', 'M');



nexstar.add('IsGPSLinked', ['P', 1, 176, 55, 0, 0, 0, 1], function (b) {
    // console.log('parse IsGPSLinked', b);
    return b.reduce((result, value) => result || (value != 0), false);
});

nexstar.add('GPSGetLatitude', ['P', 1, 176, 1, 0, 0, 0, 3], function (b) {
    return (((b[0] * 65536) + (b[1] * 256) + b[2]) / 16777216) * 360;
});

nexstar.add('GPSGetLongitude', ['P', 1, 176, 2, 0, 0, 0, 3], function (b) {
    return (((b[0] * 65536) + (b[1] * 256) + b[2]) / 16777216) * 360;
});

nexstar.add('GPSGetDate', ['P', 1, 176, 3, 0, 0, 0, 2], function (b) {
    return b[0] + '/' + b[1];
});

nexstar.add('GPSGetYear', ['P', 1, 176, 4, 0, 0, 0, 2], function (b) {
    return (b[0] * 256) + b[1];
});

nexstar.add('GPSGetTime', ['P', 1, 176, 51, 0, 0, 0, 3], function (b) {
    return b.join(':');
});

nexstar.add('RTCGetDate', ['P', 1, 178, 3, 0, 0, 0, 2], function (b) {
    // console.log('parse RTCGetDate', b);
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


nexstar.add('unknown', function command(args) {
    return args[0];
}, {
    buffer: true
}, function parse(buffer) {
    return buffer;
});

module.exports = nexstar;
