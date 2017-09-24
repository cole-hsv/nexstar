'use strict';

var assert = require('assert');
var sexa = require('./sexagesimal');

describe('sexagesimal conversions', function () {
    it('sexa should exist from ../lib/sexagesimal', function () {
        assert(sexa);
    });

    [
        [false, 23, 26, 49, 23.446944444444444, '23°26′49″'],
        [true, 23, 26, 49, -23.446944444444444, '-23°26′49″'],
        [false, 18, 36, 57.4, 18.61594444444444, '18°36′57.4″'],
        [false, 38, 48, 6, 38.80166666666667, '38°48′6″']
    ].forEach(function (test) {
        var [neg, h, m, s, expected, string] = test;
        it(`dmsToDeg: ${neg ? '-' : ''}${h}:${m}:${s}`, function () {
            // Example p. 7.
            var res = sexa.dmsToDeg(neg, h, m, s);
            assert.equal(res, expected);
        });

        it(`DegToDMS: ${expected}`, function () {
            var res = sexa.DegToDMS(expected);
            assert.equal(JSON.stringify(res), JSON.stringify([neg, h, m, s]));
        });

        // it(`DegToHmsString: ${expected}`, function () {
        //     var res = sexa.DegToHmsString(expected);
        //     assert.equal(res, string);
        // });

        it(`degToDmsString: ${expected}`, function () {
            var res = sexa.degToDmsString(expected);
            assert.equal(res, string);
        });

    });

    [
        [4, 0, 0, 60, '4ʰ0ᵐ0ˢ'],
        [18, 36, 57.4, 279.2391666666666, '18ʰ36ᵐ57ˢ.4'],
        [24, 0, 0, 0, '24ʰ0ᵐ0ˢ', 0, '0ʰ0ᵐ0ˢ'],
        [25, 0, 0, 15, '25ʰ0ᵐ0ˢ', 1, '1ʰ0ᵐ0ˢ'],
        [23, 0, 0, 345, '23ʰ0ᵐ0ˢ'],
        [-1, 0, 0, 345, '-1ʰ0ᵐ0ˢ', 23, '23ʰ0ᵐ0ˢ']
    ].forEach(function (test) {
        var [h, m, s, expected, string, h2, string2] = test;
        it(`raToDec: ${h}:${m}:${s}`, function () {
            var res = sexa.raToDec(h, m, s);
            assert.equal(res, expected);
        });

        it(`DegToRa: ${h}:${m}:${s}`, function () {
            var res = sexa.DegToRa(expected);
            var h_correct = h2 == undefined ? h : h2;
            assert.equal(JSON.stringify(res), JSON.stringify([false, h_correct, m, s]));
        });

        it(`hmsToString: ${h}:${m}:${s}`, function () {
            var res = sexa.hmsToString(false, h, m, s);
            assert.equal(res, string);
        });

        it(`degRaToHMSString: ${h}:${m}:${s}`, function () {
            var res = sexa.degRaToHMSString(expected);
            assert.equal(res, string2 || string);
        });


    });


});