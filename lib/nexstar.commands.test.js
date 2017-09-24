/* eslint max-lines: ["error", {"max": 500}]*/

'use strict';

var assert = require('assert');
var nexstar = require('./nexstar.js');
var moment = require('moment-timezone');
var sexa = require('./sexagesimal.js');

fdescribe('nexstar module commands', function() {
  // Each test is an array of `[arg, expected]`
  var tests = {
    getVersion: { expected: 'V' },
    getDeviceVersion: [
      {
        args: [16],
        expected: Buffer.from([80, 1, 16, 254, 0, 0, 0, 2])
      },
      {
        args: [176],
        expected: Buffer.from([80, 1, 176, 254, 0, 0, 0, 2])
      }
    ],
    echo: {
      args: [17],
      expected: Buffer.from([75, 17])
    },
    getTrackingMode: { expected: 't' },
    isGOTOinProgress: { expected: 'L' },
    getModel: { expected: 'm' },
    getLocation: { expected: 'w' },
    getTime: { expected: 'h' },
    getAzAlt: { expected: 'z' },
    getRaDec: { expected: 'e' },
    getAzAltLo: { expected: 'Z' },
    getRaDecLo: { expected: 'E' },
    isAlignmentComplete: { expected: 'J' },
    cancelGOTO: { expected: 'M' },
    isGPSLinked: { expected: Buffer.from([80, 1, 176, 55, 0, 0, 0, 1]) },
    rtcGetDate: { expected: Buffer.from([80, 1, 178, 3, 0, 0, 0, 2]) },
    rtcGetYear: { expected: Buffer.from([80, 1, 178, 4, 0, 0, 0, 2]) },
    rtcGetTime: { expected: Buffer.from([80, 1, 178, 51, 0, 0, 0, 3]) },
    rtcSetDate: {
      args: [2, 4],
      expected: Buffer.from([80, 3, 178, 131, 2, 4])
    },
    rtcSetYear: {
      args: [2016],
      expected: Buffer.from([80, 3, 178, 132, 7, 224])
    },
    rtcSetTime: {
      args: [moment.tz('2017-02-04T15:11:49-06:00', 'US/Central').toDate()],
      expected: Buffer.from([80, 4, 178, 179, 15, 11, 49])
    },
    getAutoGuideRate: { expected: Buffer.from([80, 1, 16, 71, 0, 0, 0, 1]) },
    gotoRaDec: [
      // {
      //   only: true,
      //   args: [sexa.raToDec(14, 50, ), sexa.dmsToDeg(false, 11, 52, 59.3)],
      //   expected: Buffer.from('7239453536393144342c333441463146464400')
      // },
      {
        args: [0, 0],
        expected: Buffer.from('r00000000,00000000')
      },
      {
        args: [74.0644383430481, 26.444199085235596],
        expected: Buffer.from('r34AB0500,12CE0500')
      },
      {
        args: [26.251938343048096, 90.0001072883606],
        expected: Buffer.from('r12AB0500,40000500')
      },
      {
        // Regulus: ra 10h9m16.18s dec 11 52' 59.3
        args: [sexa.raToDec(10, 9, 16.18), sexa.dmsToDeg(false, 11, 52, 59.3)],
        expected: Buffer.from('r6C508A1C,08734269')
      },
      {
        // Vega ra: 18h36m57.4s 279.2375 dec: +38 48'06" 38.8017 from hand controller
        args: [sexa.raToDec(18, 36, 57.4), sexa.dmsToDeg(false, 38, 48, 6)],
        expected: Buffer.from('rC691F05F,1B97A0BA')
      }
    ],
    gotoRaDecLo: [
      {
        args: [74.0643310546875, 26.444091796875],
        expected: Buffer.from('R34AB,12CE')
      }
    ],
    gotoAzAlt: [
      {
        args: [26.251938343048096, 90.0001072883606],
        expected: Buffer.from('b12AB0500,40000500')
      }
    ],
    gotoAzAltLo: [
      {
        args: [26.251938343048096, 90],
        expected: Buffer.from('B12AB,4000')
      }
    ],
    syncRaDec: [
      {
        args: [74.0644383430481, 26.444199085235596],
        expected: Buffer.from('s34AB0500,12CE0500')
      }
    ],
    syncRaDecLo: [
      {
        args: [74.0643310546875, 26.444091796875],
        expected: Buffer.from('S34AB,12CE')
      }
    ],
    setTrackingMode: [
      {
        args: [0],
        expected: Buffer.from([84, 0])
      },
      {
        args: [3],
        expected: Buffer.from([84, 3])
      }
    ],
    slew: [
      {
        args: ['az+', 150],
        expected: Buffer.from([80, 3, 16, 6, 2, 88, 0, 0])
      },
      {
        args: ['az-', 150],
        expected: Buffer.from([80, 3, 16, 7, 2, 88, 0, 0])
      },
      {
        args: ['ra+', 150],
        expected: Buffer.from([80, 3, 16, 6, 2, 88, 0, 0])
      },
      {
        args: ['ra-', 150],
        expected: Buffer.from([80, 3, 16, 7, 2, 88, 0, 0])
      },
      {
        args: ['alt+', 150],
        expected: Buffer.from([80, 3, 17, 6, 2, 88, 0, 0])
      },
      {
        args: ['alt-', 150],
        expected: Buffer.from([80, 3, 17, 7, 2, 88, 0, 0])
      },
      {
        args: ['dec+', 150],
        expected: Buffer.from([80, 3, 17, 6, 2, 88, 0, 0])
      },
      {
        args: ['dec-', 150],
        expected: Buffer.from([80, 3, 17, 7, 2, 88, 0, 0])
      }
    ],
    slewFixed: [
      {
        args: ['az+', 1],
        expected: Buffer.from([80, 2, 16, 36, 1, 0, 0, 0])
      },
      {
        args: ['az-', 2],
        expected: Buffer.from([80, 2, 16, 37, 2, 0, 0, 0])
      },
      {
        args: ['ra+', 3],
        expected: Buffer.from([80, 2, 16, 36, 3, 0, 0, 0])
      },
      {
        args: ['ra-', 4],
        expected: Buffer.from([80, 2, 16, 37, 4, 0, 0, 0])
      },
      {
        args: ['alt+', 5],
        expected: Buffer.from([80, 2, 17, 36, 5, 0, 0, 0])
      },
      {
        args: ['alt-', 6],
        expected: Buffer.from([80, 2, 17, 37, 6, 0, 0, 0])
      },
      {
        args: ['dec+', 7],
        expected: Buffer.from([80, 2, 17, 36, 7, 0, 0, 0])
      },
      {
        args: ['dec-', 8],
        expected: Buffer.from([80, 2, 17, 37, 8, 0, 0, 0])
      }
    ],
    setLocation: [
      {
        expected: Buffer.from([87, 33, 50, 41, 0, 118, 20, 17, 1]),
        args: [33, 50, 41, 0, 118, 20, 17, 1]
      },
      {
        expected: Buffer.from([87, 34, 38, 0, 0, 86, 32, 13, 1]),
        args: [34, 38, 0, 0, 86, 32, 13, 1]
      }
    ],
    setTime: [
      {
        expected: Buffer.from([72, 16, 31, 37, 12, 20, 16, 250, 0]),
        args: [moment.utc('2016-12-20T22:31:37.000+00:00').toDate()]
      },
      {
        expected: Buffer.from([72, 15, 11, 49, 2, 4, 17, 250, 0]),
        args: [moment.tz('2017-02-04T15:11:49-06:00', 'US/Central').toDate()]
      },
      {
        expected: Buffer.from([72, 16, 11, 49, 8, 2, 15, 251, 1]),
        args: [moment.tz('2015-08-02T15:11:49-06:00', 'US/Central').toDate()]
      }
    ]
  };

  function parseTest(name, test) {
    if (Buffer.isBuffer(test.expected)) {
      console.log('parse command test', new Uint8Array(test.expected).toString(), JSON.stringify(test.expected));
      assert.equal(JSON.stringify(nexstar[name](...(test.args || [])).command()), JSON.stringify(test.expected));
    } else {
      assert.equal(nexstar[name](...(test.args || [])).command(), test.expected);
    }
  }

  function lookupTest(name, test) {
    // test lookups
    var lookup = nexstar.find(test.expected);
    // console.log('command', name, lookup);
    if (!lookup) console.error('lookupTest', name, test);
    // expect(lookup).toBeDefined();
  }

  nexstar.names.forEach(function(name) {
    // eslint-disable-line consistent-return
    // add pending test
    if (!tests[name]) return it(`should get command ${name}`);
    var test = Array.isArray(tests[name]) ? tests[name] : [tests[name]];

    test.forEach(function(t) {
      var itis = t.only ? it.only : it;
      itis(`should get command ${name}${test.length > 1 ? `: ${JSON.stringify(t.args)}` : ''}`, function() {
        parseTest(name, t);
      });

      itis(`should get command lookup ${name}${test.length > 1 ? `: ${JSON.stringify(t.args)}` : ''}`, function() {
        lookupTest(name, t);
      });
    });
  });
});