var _ = require('lodash/fp');

function commandLookup(cmd, options) {
    if (_.isFunction(cmd)) return options.lookup;
    var PCCmd = cmd.slice(0, 1).toString();
    if (PCCmd == 'P') {
        var params = cmd.slice(1, 4);
        return PCCmd + params.toString('hex');
    }
    return PCCmd;
}


var Protocol = function Protocol() {
    var self = this;
    self.names = [];
    self.lookup = {};
    self.lookupRe = [];

    self.getLookupKey = function getLookupKey(buffer) {
        var key = buffer.slice(0, 1).toString();
        if (key == 'P') {
            key += buffer.slice(1, 4).toString('hex');
        }
        return key;
    };

    self.find = function find(buffer) {
        var key = self.getLookupKey(buffer);
        if (self.lookup[key]) return self.lookup[key];
        var l = self.lookupRe.filter(x => x.lookup.exec(key));
        if (l.length > 1) console.error(`find returned more than one match ${l.map(x => x.name)}`);
        return l[0];
    };

    self.getLookup = function getLookup(name) {
        return _.filter(function(value) {
            return value.name == name;
        })(self.lookup);
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
        if (self.lookup[lookup]) console.warn(`${name} has the same lookup key as ${self.lookup[lookup].name}: ${lookup}`);
        // console.log(lookup instanceof RegExp, name, lookup);

        if (lookup instanceof RegExp) {
            self.lookupRe.push({
                name,
                parse: parser,
                lookup
            });
        } else {
            self.lookup[lookup] = {
                name: name,
                parse: parser,
                lookup: lookup
            };
        }

        // console.log(name, lookup);
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
