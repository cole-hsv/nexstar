'use strict';

/**
 * separate fix `i` from fraction `f`
 * @private
 * @param {Number} float
 * @returns {Array} [i, f]
 *  {Number} i - (int) fix value
 *  {Number} f - (float) fractional portion; always > 1
 */
function modf(float) {
    var i = Math.trunc(float);
    var f = Math.abs(float - i);
    return [i, f];
}

/**
 * Rounds `float` value by precision
 * @private
 * @param {Number} float - value to round
 * @param {Number} precision - (int) number of post decimal positions
 * @return {Number} rounded `float`
 */
function round(float, precision) {
    precision = (precision === undefined ? 10 : precision);
    return parseFloat(float.toFixed(precision), 10);
}

var sexa = {
    /**
     * DegToDMS converts from decimal degrees to parsed sexagesimal angle component.
     * @param {Number} deg - angle in degree
     * @returns {Array} [neg, d, m, s]
     *  {Boolean} neg - sign, true if negative
     *  {Number} d - (int) degree
     *  {Number} m - (int) minute
     *  {Number} s - (float) second
     */
    DegToDMS: function DegToDMS(deg) {
        var neg = (deg < 0);
        deg = Math.abs(deg);
        var [d, s] = modf(deg % 360);
        var [m, s1] = modf(s * 60);
        s = round(s1 * 60); // may introduce an error < 1e13
        return [neg, d, m, s];
    },

    /**
     * DMSToDeg converts from parsed sexagesimal angle components to decimal
     * degrees.
     * @param {Boolean} neg - sign, true if negative
     * @param {Number} d - (int) degree
     * @param {Number} m - (int) minute
     * @param {Number} s - (float) second
     * @returns {Number} angle in degree
     */
    DMSToDeg: function DMSToDeg(neg, d, m, s) {
        s = (((d * 60 + m) * 60) + s) / 3600;
        if (neg) {
            return -s;
        }
        return s;
    },

    /**
     * constructs a new RA value from hour, minute, and second components.
     * Negative values are not supported, RA wraps values larger than 24
     * to the range [0,24) hours.
     * @param {Number} h - (int) hour
     * @param {Number} m - (int) minute
     * @param {Number} s - (float) second
     */
    RaToDeg: function RaToDeg(h, m, s) {
        let hr = sexa.DMSToDeg(false, h, m, s) % 24;

        // return hr * 15 * Math.PI / 180;
        return (hr + (hr < 0 ? 24 : 0)) * 15;
    },

    /**
     * Converts from decimal degrees to right ascention component.
     * @param {Number} deg - angle in degree
     * @returns {Array} [h, m, s]
     *  {Number} h - (int) hours
     *  {Number} m - (int) minute
     *  {Number} s - (float) second
     */
    DegToRa: function DegToRa(deg) {
        let dms = sexa.DegToDMS(deg / 15);

        // return hr * 15 * Math.PI / 180;
        return dms;
    },

    /**
     * Print deg using `HʰMᵐsˢ.ss`
     * @param {Number} deg - angle in degree
     * @param {Number} precision - precision of `.ss`
     * @returns {String}
     */
    DegRaToHMSString: function DegRaToHMSString(deg, precision) {
        var [neg, h, m, s] = sexa.DegToRa(deg);
        return sexa.hmsToString(neg, h, m, s, precision);
    },

    // /**
    //  * Print deg using `HʰMᵐsˢ.ss`
    //  * @param {Number} deg - angle in degree
    //  * @param {Number} precision - precision of `.ss`
    //  * @returns {String}
    //  */
    // DegToHmsString: function DegToHmsString(deg, precision) {
    //     var [neg, h, m, s] = sexa.DegToDMS(deg);
    //     return sexa.hmsToString(neg, h, m, s, precision);
    // },

    /**
     * Print deg using `HʰMᵐsˢ.ss`
     * @param {Boolean} neg - sign, true if negative
     * @param {Number} d - (int) degree
     * @param {Number} m - (int) minute
     * @param {Number} s - (float) second
     * @param {Number} precision - precision of `.ss`
     * @returns {String}
     */
    hmsToString: function DegToHmsString(neg, h, m, s, precision) {
        var [si, sf] = modf(s);
        if (precision === 0) {
            si = round(s, 0);
            sf = 0;
        } else {
            sf = round(sf, precision).toString().substr(1);
        }
        var str = (neg ? '-' : '') +
            (h + 'ʰ') +
            (m + 'ᵐ') +
            (si + 'ˢ') +
            (sf || '');
        return str;
    },

    /**
     * Print angle in degree using `d°m´s.ss″`
     * @param {Number} deg - angle in degree
     * @param {Number} precision - precision of `s.ss`
     * @returns {String}
     */
    DegToDmsString(deg, precision) {
        var [neg, d, m, s] = sexa.DegToDMS(deg);
        s = round(s, precision).toString().replace(/^0\./, '.');
        var str = (neg ? '-' : '') +
            (d + '°') +
            (m + '′') +
            (s + '″');
        return str;
    }

};

module.exports = sexa;
