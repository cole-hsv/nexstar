var _ = require('lodash/fp');

var Protocol = function Protocol() {
    var self = this;
    self.add = function (name, command, options, parse) {
        // convert an array to a buffer, if the first index is a string, convert that to a number
        if (Array.isArray(command)) command = Buffer.from(command.map(function (i) {
            return _.isString(i) ? i.charCodeAt(0) : i;
        }));

        // last argument after command is parsing function
        if (!parse && _.isFunction(options)) {
            parse = options;
            options = {};
        }

        options = options || {};

        function callParse(buffer) {
            buffer = options.buffer ? buffer : new Uint8Array(buffer);
            // console.log('buffer', buffer);
            if (parse) return parse(buffer);
            return buffer.toString('hex');
        }

        self[name] = {
            name: name,
            command: command,
            parse: callParse
        };
    };
    return self;
};

module.exports = Protocol;
