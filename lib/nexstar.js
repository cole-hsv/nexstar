/* eslint max-lines: ["error", {"max": 500}]*/

'use strict';

var protocol = require('./protocol.js');
var moment = require('moment-timezone');
// var _ = require('lodash/fp');
var nexstar = protocol();
var localtz = moment.tz.guess();

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


/**
 * *********************************
 * Nexstar Hand Controller Protocol
 * *********************************
 */

nexstar.add('getRaDecLo', 'E', {buffer: true}, function (b) {
    return nexstar.parsePosition(b, ['ra', 'dec'], LOWPRECISION);
});

nexstar.add('getRaDec', 'e', {buffer: true}, function (b) {
    return nexstar.parsePosition(b, ['ra', 'dec'], HIGHPRECISION);
});

nexstar.add('getAzAltLo', 'Z', {buffer: true}, function (b) {
    return nexstar.parsePosition(b, ['az', 'alt'], LOWPRECISION);
});

nexstar.add('getAzAlt', 'z', {buffer: true}, function (b) {
    return nexstar.parsePosition(b, ['az', 'alt'], HIGHPRECISION);
});

nexstar.add('gotoRaDec', function command(args) {
    var position = nexstar.toPosition(args, HIGHPRECISION);
    return Buffer.from(`r${position}`);
}, {lookup: 'r'});

nexstar.add('gotoRaDecLo', function command(args) {
    var position = nexstar.toPosition(args, LOWPRECISION);
    return Buffer.from(`R${position}`);
}, {lookup: 'R'});

nexstar.add('gotoAzAlt', function command(args) {
    var position = nexstar.toPosition(args, HIGHPRECISION);
    return Buffer.from(`b${position}`);
}, {lookup: 'b'});

nexstar.add('gotoAzAltLo', function command(args) {
    var position = nexstar.toPosition(args, LOWPRECISION);
    return Buffer.from(`B${position}`);
}, {lookup: 'B'});

nexstar.add('syncRaDec', function command(args) {
    var position = nexstar.toPosition(args, HIGHPRECISION);
    return Buffer.from(`s${position}`);
}, {lookup: 's'});

nexstar.add('syncRaDecLo', function command(args) {
    var position = nexstar.toPosition(args, LOWPRECISION);
    return Buffer.from(`S${position}`);
}, {lookup: 'S'});


const trackingModes = {
    0: 'Off',
    1: 'Alt/Az',
    2: 'EQ North',
    3: 'EQ South'
};

nexstar.trackingModes = trackingModes;

nexstar.add('getTrackingMode', 't', function (b) {
    return trackingModes[b[0]];
});

nexstar.add('setTrackingMode', function command(args) {
    return Buffer.from(['T'.charCodeAt(0), args[0]]);
}, {lookup: 'T'});

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
    return Buffer.from([80, 3, slewModes[mode].axis,
        slewModes[mode].direction, r / 256 | 0, r % 256, 0, 0]); // eslint-disable-line no-bitwise
}

nexstar.add('slew', function command(args) {
    var [mode, rate] = args;
    return slew(slewAlias[mode], rate);
}, {lookup: /^P03/});

nexstar.add('slewFixed', function command(args) {
    var [alias, rate] = args;
    var mode = slewAlias[alias];
    return Buffer.from([80, 2, slewModes[mode].axis, slewModes[mode].fixedDirection, rate, 0, 0, 0]);
}, {lookup: /^P02/});


/**
 * Time/Location Commands (Hand Controller)
 */

nexstar.add('getLocation', 'w', function (a) {
    return {
        lat: (a[0] + (a[1] / 60) + (a[2] / 3600)) * (a[3] == 0 ? 1 : -1),
        lon: (a[4] + (a[5] / 60) + (a[6] / 3600)) * (a[7] == 0 ? 1 : -1)
    };
});

nexstar.add('setLocation', function command(args) {
    // The format of the location commands is: ABCDEFGH, where: A is the number of degrees of latitude.
    // B is the number of minutes of latitude.
    // C is the number of seconds of latitude.
    // D is 0 for north and 1 for south.
    // E is the number of degrees of longitude.
    // F is the number of minutes of longitude.
    // G is the number of seconds of longitude.
    // H is 0 for east and 1 for west.
    return Buffer.from(['W'.charCodeAt(0), ...args]);
}, {lookup: 'W'});

nexstar.add('getTime', 'h', function (a) {
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

nexstar.add('setTime', function command(args) {
    var [time] = args;
    var t = moment.tz(time, localtz);
    var offset = t.utcOffset() / 60;
    var zone = offset > 0 ? offset : 256 + offset;
    var params = [t.hour(), t.minute(), t.second(), t.month() + 1, t.date(), t.year() - 2000, zone, t.isDST() ? 1 : 0];
    return Buffer.from(['H'.charCodeAt(0), ...params]);
}, {lookup: 'H'});


/**
 * GPS Commands
 * The following table shows various commands that can be sent to a GPS unit. Note: all units of time are in UT.
 */
nexstar.add('isGPSLinked', ['P', 1, 176, 55, 0, 0, 0, 1], function (b) {
    // console.log('parse isGPSLinked', b);
    return b.reduce((result, value) => result || (value != 0), false);
});

nexstar.add('gpsGetLatitude', ['P', 1, 176, 1, 0, 0, 0, 3], function (b) {
    // console.log(gpsGetLatitude, b);
    return (((b[0] * 65536) + (b[1] * 256) + b[2]) / 16777216) * 360;
});

nexstar.add('gpsGetLongitude', ['P', 1, 176, 2, 0, 0, 0, 3], function (b) {
    return (((b[0] * 65536) + (b[1] * 256) + b[2]) / 16777216) * 360;
});

nexstar.add('gpsGetDate', ['P', 1, 176, 3, 0, 0, 0, 2], function (b) {
    return `${b[0]}/${b[1]}`;
});

nexstar.add('gpsGetYear', ['P', 1, 176, 4, 0, 0, 0, 2], function (b) {
    return (b[0] * 256) + b[1];
});

nexstar.add('gpsGetTime', ['P', 1, 176, 51, 0, 0, 0, 3], function (b) {
    return b.join(':');
});

/**
 * rtc Commands
 * The following table shows various rtc commands on the CGE mount.
 */

nexstar.add('rtcGetDate', ['P', 1, 178, 3, 0, 0, 0, 2], function (b) {
    // console.log('parse rtcGetDate', b);
    return `${b[0]}/${b[1]}`;
});

nexstar.add('rtcGetYear', ['P', 1, 178, 4, 0, 0, 0, 2], function (b) {
    return (b[0] * 256) + b[1];
});

nexstar.add('rtcGetTime', ['P', 1, 178, 51, 0, 0, 0, 3], function (b) {
    return b.join(':');
});

nexstar.add('rtcSetDate', function command(args) {
    var [month, day] = args;
    var params = [month, day];
    return Buffer.from(['P'.charCodeAt(0), 3, 178, 131, ...params]);
}, {lookup: 'P03b283'});


nexstar.add('rtcSetYear', function command(args) {
    var [year] = args;
    var params = [(year / 256) | 0, year % 256]; // eslint-disable-line no-bitwise
    return Buffer.from(['P'.charCodeAt(0), 3, 178, 132, ...params]);
}, {lookup: 'P03b284'});

nexstar.add('rtcSetTime', function command(args) {
    var [time] = args;
    var t = moment(time);
    var params = [t.hour(), t.minute(), t.second()];
    return Buffer.from(['P'.charCodeAt(0), 4, 178, 179, ...params]);
}, {lookup: 'P04b2b3'});

/**
 * Miscellaneous Commands
 */
nexstar.add('getVersion', 'V', b => `${b[0]}.${b[1]}`);
nexstar.add('getDeviceVersion', function command(args) {
    var [dev] = args;
    return Buffer.from(['P'.charCodeAt(0), 1, dev, 254, 0, 0, 0, 2]);
}, {lookup: /^P01..fe/}, b => `${b[0]}.${b[1]}`);

nexstar.add('getModel', 'm');
nexstar.add('echo', function command(args) {
    var [x] = args;
    return Buffer.from(['K'.charCodeAt(0), x]);
}, {lookup: 'K'});
nexstar.add('isAlignmentComplete', 'J', integer2boolean);
nexstar.add('isGOTOinProgress', 'L', string2Boolean);
nexstar.add('cancelGOTO', 'M');

nexstar.add('getAutoGuideRate', ['P', 1, 16, 0x47, 0, 0, 0, 1], function (b) {
    // console.log('b', b);
    return 100 * b[0] / 256;
});


nexstar.add('unknown', function command(args) {
    return args[0];
}, {buffer: true}, function parse(buffer) {
    return buffer;
});

module.exports = nexstar;
