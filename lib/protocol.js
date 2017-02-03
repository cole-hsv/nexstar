var _ = require('lodash/fp');

function commandLookup(cmd, options) {
    if (_.isFunction(cmd)) return options.lookup;
    var PCCmd = cmd.slice(0, 1).toString();
    if (PCCmd == 'P') {
        return PCCmd + cmd.slice(1, 4).toString('hex');
    }
    return PCCmd;
}


var Protocol = function Protocol() {
    var self = this;
    self.names = [];
    self.lookup = {};

    self.find = function find(buffer) {
        var key = buffer.slice(0, 1).toString();
        // console.log('key', key);
        if (key == 'P') {
            key = key + buffer.slice(1, 4).toString('hex');
        }
        return self.lookup[key];
    };

    self.add = function add(name, command, options, parse) {
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

        function parser(buffer) {
            buffer = options.buffer ? buffer : new Uint8Array(buffer);
            // console.log('buffer', buffer);
            if (parse) return parse(buffer);
            return buffer.toString('hex');
        }

        self.names.push(name);
        var lookup = commandLookup(command, options);
        self.lookup[lookup] = name;

        self[name] = function (...args) {
            // console.log('protocol', args);
            return {
                name: name,
                command: function commander() {
                    return _.isFunction(command) ? command(args) : command;
                },
                parse: parser,
                args: args
            };
        };
    };
    return self;
};

module.exports = Protocol;
