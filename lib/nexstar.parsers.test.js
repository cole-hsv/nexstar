/* eslint max-lines: ["error", {"max": 500}]*/

'use strict';

var assert = require('assert');
var nexstar = require('./nexstar.js');
var moment = require('moment-timezone');
var sexa = require('./sexagesimal.js');

describe('nexstar module', function () {
  it('should exist from ../lib/nexstar.js', function () {
    assert(nexstar);
  });

  describe('converters', function () {

    function testConverter(test, precision, type) {
      it(`should parse a ${type} precision position string: ${test.arg}`, function () {
        var buffer = Buffer.from(test.arg);
        var result = nexstar.parsePosition(buffer, test.parse, precision);
                // console.log('parse', test.arg, JSON.stringify(result), JSON.stringify(test.expected));
        assert.equal(JSON.stringify(result), JSON.stringify(test.expected));
      });

      var toarg = [test.expected[test.parse[0]], test.expected[test.parse[1]]];

      it(`should create a ${type} precision position string: ${toarg}`, function () {
        var result = nexstar.toPosition(toarg, precision);
                // console.log('create', result, test.arg);
        assert.equal(result, test.arg);
      });
    }

    [{
      arg: '12AB0500,40000500',
      parse: ['az', 'alt'],
      expected: {
        az: 26.251938343048096,
        alt: 90.0001072883606
      }
    }, {
      arg: '34AB0500,12CE0500',
      parse: ['ra', 'dec'],
      expected: {
        ra: 74.0644383430481,
        dec: 26.444199085235596
      }
    }, {
            // Regulus: ra 10h9m16.18s dec 11 52' 59.3
      arg: '6C500300,0866F800',
      parse: ['ra', 'dec'],
      expected: {
        ra: 152.31451749801636,
        dec: 11.815624237060547
      }
    }].forEach(function (test) {
      testConverter(test, nexstar.HIGHPRECISION, 'high');
    });

    [{
      arg: '12AB,4000',
      parse: ['az', 'alt'],
      expected: {
        az: 26.2518310546875,
        alt: 90
      }
    }, {
      arg: '34AB,12CE',
      parse: ['ra', 'dec'],
      expected: {
        ra: 74.0643310546875,
        dec: 26.444091796875
      }
    }, {
            // Regulus: ra 10h9m16.18s dec 11 52' 59.3
      arg: '6C50,0866',
      parse: ['ra', 'dec'],
      expected: {
        ra: 152.314453125,
        dec: 11.810302734375
      }
    }].forEach(function (test) {
      testConverter(test, nexstar.LOWPRECISION, 'low');
    });
  });

  describe('parsers', function () {
    var empty = {
      arg: [],
      expected: ''
    };

        // Each test is an array of `[arg, expected]`
    var tests = {
      getModel: {
        arg: [14],
        expected: '14'
      },
      getVersion: {
        arg: [4, 21],
        expected: '4.21'
      },
      getDeviceVersion: {
        arg: [1, 2],
        expected: '1.2'
      },
      echo: {
        arg: [17],
        expected: '17'
      },
      getTrackingMode: {
        arg: [2],
        expected: 'EQ North'
      },
      isGOTOinProgress: [{
        arg: [48],
        expected: false
      }, {
        arg: [49],
        expected: true
      }],
      getLocation: [{
        arg: [34, 38, 0, 0, 86, 32, 13, 1],
        expected: {
          lat: 34.63333333333333,
          lon: -86.53694444444444
        }
      }, {
        arg: [34, 38, 0, 1, 86, 32, 13, 0],
        expected: {
          lat: -34.63333333333333,
          lon: 86.53694444444444
        }
      }],
      getTime: {
        arg: [16, 31, 37, 12, 20, 16, 250, 0],
        expected: moment.utc('2016-12-20T22:31:37.000+00:00')
      },
      getAzAlt: [
        {
                    // az:157 36'31" 157.6086 alt:037 52'52" 37.88111 from hand controller.
                    // expect small diff from sample to readout time
          arg: '6F357F00,1AF00700',
          expected: {
            az: 156.38761281967163,
            alt: 37.881009578704834
          }
        },
        {
          arg: '12AB0500,40000500',
          expected: {
            az: 26.251938343048096,
            alt: 90.0001072883606
          }
        }],
      getAzAltLo: [
        {
          arg: '12AB,4000',
          expected: {
            az: 26.2518310546875,
            alt: 90
          }
        }],
      getRaDec: [{
                // Regulus: ra 10h9m16.18s dec 11 52' 59.3
                // 36433446463830302c3038364630303030 6C4FF800,086F0000
        arg: '6C500300,0866F800',
        expected: {
          ra: 152.31451749801636,
          dec: 11.815624237060547
        }
      }, {
                // Vega ra: 18h36m57.4s 279.2375 dec: +38 48'06" 38.8017 from hand controller
        arg: 'C6AB0400,1B976200',
        expected: {
          ra: 279.376916885376,
          dec: 38.800320625305176
        }
      }, {
        arg: '34AB0500,12CE0500',
        expected: {
          ra: 74.0644383430481,
          dec: 26.444199085235596
        }
      }],
      getRaDecLo: [{
                // Regulus: ra 10h9m16.18s dec 11 52' 59.3
                // 36433446463830302c3038364630303030 6C4FF800,086F0000
        arg: '6C50,0866',
        expected: {
          ra: 152.314453125,
          dec: 11.810302734375
        }
      }],
      getAutoGuideRate: {
        arg: [128],
        expected: 50
      },
      isAlignmentComplete: [{
        arg: '1',
        expected: true
      }, {
        arg: [0],
        expected: false
      }],
      isGPSLinked: [{
        arg: [0, 1],
        expected: true
      }, {
        arg: [0, 0],
        expected: false
      }],
      gpsGetLatitude: {
        skip: true,
        arg: [34, 38, 0],
        expected: 34.63333333333333
      },
      gpsGetLongitude: {
        skip: true,
        arg: [86, 32, 13],
        expected: 86.52972222222222
      },
      gpsGetDate: {
        arg: [12, 26],
        expected: '12/26'
      },
      gpsGetYear: {
        arg: [7, 224],
        expected: 2016
      },
      gpsGetTime: {
        arg: [16, 36, 48],
        expected: '16:36:48'
      },
      rtcGetDate: {
        arg: [12, 26],
        expected: '12/26'
      },
      rtcGetYear: {
        arg: [7, 224],
        expected: 2016
      },
      rtcGetTime: {
        arg: [16, 36, 48],
        expected: '16:36:48'
      },
      gotoRaDec: [{only: true, arg:'7239453536393144342c333441463146464400', expected:''}],
      gotoRaDecLo: empty,
      gotoAzAlt: empty,
      gotoAzAltLo: empty,
      syncRaDec: empty,
      syncRaDecLo: empty,
      cancelGOTO: empty,
      setTrackingMode: empty,
      slew: empty,
      slewFixed: empty,
      setLocation: empty,
      setTime: empty,
      rtcSetDate: empty,
      rtcSetYear: empty,
      rtcSetTime: empty,
      unknown: {
        arg: [1, 2, 3, 4, 5],
        expected: {
          'type': 'Buffer',
          'data': [1, 2, 3, 4, 5]
        }
      }

    };

    function parseTest(name, test) {
            // console.log('parseTest', name, test[name]);
      var actual = nexstar[name]().parse(Buffer.from(test.arg));
      assert.equal(JSON.stringify(actual), JSON.stringify(test.expected));
    }

    nexstar.names.forEach(function (name) {
      if (tests[name]) {
        var test = Array.isArray(tests[name]) ? tests[name] : [tests[name]];

        test.forEach(function (t) {
          var itis = it;
          if (t.only) itis = it.only;
          if (t.skip) itis = it.skip;
          itis(`should parse ${name}${test.length > 1 ? `: ${t.arg}` : ''}`, function () {
            parseTest(name, t);
          });
        });
      } else {
        it(`should parse ${name}`);
      }

    });


  });

});