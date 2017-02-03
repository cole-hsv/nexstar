'use strict';

var assert = require('assert');
var nexstar = require('../lib/nexstar.js');
var moment = require('moment-timezone');
var sexa = require('../lib/sexagesimal.js');

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
        var test = {
            GetModel: {
                arg: [14],
                expected: '14'
            },
            GetVersion: {
                arg: [4, 21],
                expected: '4.21'
            },
            GetTrackingMode: {
                arg: [2],
                expected: 'EQ North'
            },
            IsGOTOinProgress: [{
                arg: [48],
                expected: false
            }, {
                arg: [49],
                expected: true
            }],
            GetLocation: {
                arg: [34, 38, 0, 0, 86, 32, 13, 1],
                expected: {
                    lat: 34.63333333333333,
                    lon: 86.52972222222222
                }
            },
            GetTime: {
                arg: [16, 31, 37, 12, 20, 16, 250, 0],
                expected: moment.utc('2016-12-20T22:31:37.000+00:00')
            },
            GetAzAlt: [
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
            GetAzAltLo: [
                {
                    arg: '12AB,4000',
                    expected: {
                        az: 26.2518310546875,
                        alt: 90
                    }
                }],
            GetRaDec: [{
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
            GetRaDecLo: [{
                // Regulus: ra 10h9m16.18s dec 11 52' 59.3
                // 36433446463830302c3038364630303030 6C4FF800,086F0000
                arg: '6C50,0866',
                expected: {
                    ra: 152.314453125,
                    dec: 11.810302734375
                }
            }],
            GetAutoGuideRate: {
                arg: [128],
                expected: 50
            },
            IsAlignmentComplete: [{
                arg: '1',
                expected: true
            }, {
                arg: [0],
                expected: false
            }],
            IsGPSLinked: [{
                arg: [0, 1],
                expected: true
            }, {
                arg: [0, 0],
                expected: false
            }],
            RTCGetDate: {
                arg: [12, 26],
                expected: '12/26'
            },
            RTCGetYear: {
                arg: [7, 224],
                expected: 2016
            },
            RTCGetTime: {
                arg: [16, 36, 48],
                expected: '16:36:48'
            },
            GotoRaDec: empty,
            GotoRaDecLo: empty,
            GotoAzAlt: empty,
            GotoAzAltLo: empty,
            SyncRaDec: empty,
            SyncRaDecLo: empty,
            CancelGOTO: empty,
            SetTrackingMode: empty,
            Slew: empty,
            SlewFixed: empty,
            SetLocation: empty,
            SetTime: empty,
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
            if (test[name]) {
                var tests = Array.isArray(test[name]) ? test[name] : [test[name]];

                tests.forEach(function (t) {
                    var itis = t.only ? it.only : it;
                    itis(`should parse ${name}${tests.length > 1 ? ': ' + t.arg : ''}`, function () {
                        parseTest(name, t);
                    });
                });
            } else {
                it(`should parse ${name}`);
            }

        });


    });

    describe('commands', function () {

        // Each test is an array of `[arg, expected]`
        var test = {
            GetVersion: {
                expected: 'V'
            },
            GetTrackingMode: {
                expected: 't'
            },
            IsGOTOinProgress: {
                expected: 'L'
            },
            GetModel: {
                expected: 'm'
            },
            GetLocation: {
                expected: 'w'
            },
            GetTime: {
                expected: 'h'
            },
            GetAzAlt: {
                expected: 'z'
            },
            GetRaDec: {
                expected: 'e'
            },
            GetAzAltLo: {
                expected: 'Z'
            },
            GetRaDecLo: {
                expected: 'E'
            },
            IsAlignmentComplete: {
                expected: 'J'
            },
            CancelGOTO: {
                expected: 'M'
            },
            IsGPSLinked: {
                expected: Buffer.from([80, 1, 176, 55, 0, 0, 0, 1])
            },
            RTCGetDate: {
                expected: Buffer.from([80, 1, 178, 3, 0, 0, 0, 2])
            },
            RTCGetYear: {
                expected: Buffer.from([80, 1, 178, 4, 0, 0, 0, 2])
            },
            RTCGetTime: {
                expected: Buffer.from([80, 1, 178, 51, 0, 0, 0, 3])
            },
            GetAutoGuideRate: {
                expected: Buffer.from([80, 1, 16, 71, 0, 0, 0, 1])
            },
            GotoRaDec: [{
                args: [0, 0],
                expected: Buffer.from('r00000000,00000000')
            }, {
                args: [74.0644383430481, 26.444199085235596],
                expected: Buffer.from('r34AB0500,12CE0500')
            }, {
                args: [26.251938343048096, 90.0001072883606],
                expected: Buffer.from('r12AB0500,40000500')
            }, {
                // Regulus: ra 10h9m16.18s dec 11 52' 59.3
                args: [sexa.RaToDeg(10, 9, 16.18), sexa.DMSToDeg(false, 11, 52, 59.3)],
                expected: Buffer.from('r6C508A1C,08734269')
            }, {
                // Vega ra: 18h36m57.4s 279.2375 dec: +38 48'06" 38.8017 from hand controller
                args: [sexa.RaToDeg(18, 36, 57.4), sexa.DMSToDeg(false, 38, 48, 6)],
                expected: Buffer.from('rC691F05F,1B97A0BA')
            }],
            GotoRaDecLo: [{
                args: [74.0643310546875, 26.444091796875],
                expected: Buffer.from('R34AB,12CE')
            }],
            GotoAzAlt: [{
                args: [26.251938343048096, 90.0001072883606],
                expected: Buffer.from('b12AB0500,40000500')
            }],
            GotoAzAltLo: [{
                args: [26.251938343048096, 90],
                expected: Buffer.from('B12AB,4000')
            }],
            SyncRaDec: [{
                args: [74.0644383430481, 26.444199085235596],
                expected: Buffer.from('s34AB0500,12CE0500')
            }],
            SyncRaDecLo: [{
                args: [74.0643310546875, 26.444091796875],
                expected: Buffer.from('S34AB,12CE')
            }],
            SetTrackingMode: [{
                args: [0],
                expected: Buffer.from([84, 0])
            }, {
                args: [3],
                expected: Buffer.from([84, 3])
            }],
            Slew: [{
                args: ['az+', 150],
                expected: Buffer.from([80, 3, 16, 6, 2, 88, 0, 0])
            }, {
                args: ['az-', 150],
                expected: Buffer.from([80, 3, 16, 7, 2, 88, 0, 0])
            }, {
                args: ['ra+', 150],
                expected: Buffer.from([80, 3, 16, 6, 2, 88, 0, 0])
            }, {
                args: ['ra-', 150],
                expected: Buffer.from([80, 3, 16, 7, 2, 88, 0, 0])
            }, {
                args: ['alt+', 150],
                expected: Buffer.from([80, 3, 17, 6, 2, 88, 0, 0])
            }, {
                args: ['alt-', 150],
                expected: Buffer.from([80, 3, 17, 7, 2, 88, 0, 0])
            }, {
                args: ['dec+', 150],
                expected: Buffer.from([80, 3, 17, 6, 2, 88, 0, 0])
            }, {
                args: ['dec-', 150],
                expected: Buffer.from([80, 3, 17, 7, 2, 88, 0, 0])
            }],
            SlewFixed: [{
                args: ['az+', 1],
                expected: Buffer.from([80, 2, 16, 36, 1, 0, 0, 0])
            }, {
                args: ['az-', 2],
                expected: Buffer.from([80, 2, 16, 37, 2, 0, 0, 0])
            }, {
                args: ['ra+', 3],
                expected: Buffer.from([80, 2, 16, 36, 3, 0, 0, 0])
            }, {
                args: ['ra-', 4],
                expected: Buffer.from([80, 2, 16, 37, 4, 0, 0, 0])
            }, {
                args: ['alt+', 5],
                expected: Buffer.from([80, 2, 17, 36, 5, 0, 0, 0])
            }, {
                args: ['alt-', 6],
                expected: Buffer.from([80, 2, 17, 37, 6, 0, 0, 0])
            }, {
                args: ['dec+', 7],
                expected: Buffer.from([80, 2, 17, 36, 7, 0, 0, 0])
            }, {
                args: ['dec-', 8],
                expected: Buffer.from([80, 2, 17, 37, 8, 0, 0, 0])
            }],
            SetLocation: {
                only: true,
                expected: Buffer.from([87, 34, 38, 0, 0, 86, 32, 13, 1]),
                args: [{
                    lat: 34.63333333333333,
                    lon: 86.52972222222222
                }]
            },
            SetTime: {
                expected: Buffer.from([16, 31, 37, 12, 20, 16, 250, 0]),
                args: [moment.utc('2016-12-20T22:31:37.000+00:00').toDate()]
            },
        };

        function parseTest(name, test) {
            if (Buffer.isBuffer(test.expected)) {
                // console.log('parse command test', new Uint8Array(test.expected).toString(), JSON.stringify(test.expected));
                assert.equal(JSON.stringify(nexstar[name](...(test.args || [])).command()), JSON.stringify(test.expected));
            } else {
                assert.equal(nexstar[name](...(test.args || [])).command(), test.expected);
            }
        }

        nexstar.names.forEach(function (name) {
            // add pending test
            if (!test[name]) return it(`should get command ${name}`);
            var tests = Array.isArray(test[name]) ? test[name] : [test[name]];

            tests.forEach(function (t) {
                var itis = t.only ? it.only : it;
                itis(`should get command ${name}${tests.length > 1 ? ': ' + t.args : ''}`, function () {
                    parseTest(name, t);
                });
            });
        });


    });

});
