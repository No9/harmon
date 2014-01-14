var through = require('through');
var tokenize = require('./lib/tokenize.js');
var parseSelector = require('./lib/selector.js');
var matcher = require('./lib/matcher.js');
var ent = require('ent');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var duplexer = require('duplexer');

module.exports = function (opts) {
    var selectors = [];
    var tokens = tokenize();
    var tokenBuffer = null;
    var skipping = false;
    var skipSpace = false;
    var lastToken = null;
    
    tokens.pipe(through(write, end));
    
    var tr = through(
        function (buf) { tokens.write(buf) },
        function () { tokens.end() }
    );
    
    tr.select = function (sel) {
        var r = createResult(sel, { all: false });
        return r;
    };
    
    tr.selectAll = function (sel, cb) {
        var r = createResult(sel, { all: true });
        
        r._matcher.on('pre-open', function (m) {
            r.name = m.current.name;
            r.attributes = m.current.attributes;
            r.isSelfClosing = m.current.isSelfClosing;
            cb(r);
        });
        
        r._matcher.on('tag-end', function (node) {
            r._getAttr = {};
            r._setAttr = {};
            r._rmAttr = {};
        });
    };
    
    tr.createReadStream = function (sel, opts) {
        return tr.select(sel).createReadStream(opts);
    };
    
    tr.createWriteStream = function (sel, opts) {
        return tr.select(sel).createWriteStream(opts);
    };
    
    tr.createStream = function (sel, opts) {
        return tr.select(sel).createStream(opts);
    };
    
    // End any read streams of unmatched selectors
    tr.on("end", function() {
        selectors.forEach(function(r) {
            r._readStreams.forEach(function(s) {
                if (s.readable) s.end();
            });
        });
    });
    
    return tr;
    
    function createResult (sel, opts) {
        var r = new Result(sel);
        
        if (opts.all === false) {
            r._matcher.once('unmatch', function () {
                if (!r._reading && !r._writing) {
                    var ix = selectors.indexOf(r);
                    if (ix >= 0) selectors.splice(ix, 1);
                }
            });
            r.once('read-close', function () {
                var ix = selectors.indexOf(r);
                if (ix >= 0) selectors.splice(ix, 1);
            });
        }
        
        r.on('_write-begin', function (stream) {
            if (lastToken[0] === 'tag-end'
            && lastToken[1].length > 0
            && '>' === String.fromCharCode(lastToken[1][lastToken[1].length-1])
            ) {
                if (lastToken[1].length) tr.queue(lastToken[1]);
            }
            
            if (stream._skipping !== false) {
                tokens.pause();
            }
            skipping = true;
            stream.pipe(through(write, end));
            stream.resume();
            
            function write (buf) {
                if (Buffer.isBuffer(buf)) {
                    if (buf.length) tr.queue(buf)
                }
                else if (typeof buf === 'string') {
                    if (buf.length) tr.queue(Buffer(buf));
                }
                else {
                    buf = String(buf);
                    if (buf.length) tr.queue(Buffer(buf));
                }
            }
            function end () {
                if (stream._skipping !== false) {
                    tokens.resume();
                }
            }
        });
        
        r.on('_write-end', function () {
            skipping = false;
        });
        
        r.on('queue', function (buf) { tr.queue(buf) });
        
        selectors.push(r);
        return r;
    }
    
    function write (lex) {
        lastToken = lex;
        var writeSkip = false;
        
        var sub;
        selectors.forEach(function (s) {
            s._at(lex);
            if (s._substitute !== undefined) {
                sub = s._substitute;
                s._substitute = undefined;
            }
            if (s._writing === 'next') {
                s._writing = false;
                s.emit('_write-end');
                writeSkip = true;
            }
        });
        
        if (skipSpace) {
            skipSpace = false;
            if (lex[0] === 'tag-space') return;
        }
        if (skipping || writeSkip) return;
        
        if (sub === undefined) {
            if (lex[1].length) tr.queue(lex[1]);
        }
        else if (sub === null) {
            skipSpace = true;
        }
        else if (sub.length) tr.queue(sub);
    }
    
    function end () {
        tr.queue(null);
    }
};

inherits(Result, EventEmitter);

function Result (sel) {
    var self = this;
    self._setAttr = {};
    self._rmAttr = {};
    self._getAttr = {};
    self._readStreams = [];
    self._writeStream = null;
    
    self._reading = false;
    self._writing = false;
    self._matcher = matcher(parseSelector(sel));
    
    var remainingSets = [];
    self._matcher.on('open', function (m) {
        remainingSets = Object.keys(self._setAttr);
        
        if (self._writeStream && self._writeStream.outer) {
            self._writing = true;
            self._writeLevel = m.stack.length;
            self.emit('_write-begin', self._writeStream);
        }
    });
    
    self._matcher.on('tag-end', function (m) {
        for (var i = 0; i < remainingSets.length; i++) {
            var key = remainingSets[i];
            self.emit('queue', Buffer(' ' + self._setAttr[key]));
        }
        
        if (self._readStreams.length) {
            self._reading = true;
            self._readMatcher = m;
            self._readLevel = m.stack.length;
            
            for (var i = 0; i < self._readStreams.length; i++) {
                if (self._readStreams[i]._level === undefined) {
                    self._readStreams[i]._level = self._readLevel;
                }
            }
        }
        if (self._writeStream && !self._writeStream.outer) {
            self._writing = true;
            self._writeLevel = m.stack.length;
            self.emit('_write-begin', self._writeStream);
        }
    });
    
    self._matcher.on('attribute', function (node) {
        var f = self._getAttr[node.name];
        if (f) f(node.value);
        var v = self._setAttr[node.name];
        if (v !== undefined) {
            self._substitute = v;
            var ix = remainingSets.indexOf(node.name);
            if (ix >= 0) remainingSets.splice(ix, 1);
        }
        if (self._rmAttr[node.name]) {
            self._substitute = null;
        }
    });
}

Result.prototype._at = function (lex) {
    if (this._reading) {
        if (lex[0] === 'closetag') {
            var level = this._matcher.matchers[0].stack.length;
            var removed = 0;
            
            for (var i = this._readStreams.length - 1; i >= 0; i--) {
                var s = this._readStreams[i];
                if (s._level === level) {
                    if (s.outer && lex[1].length) s.queue(lex[1]);
                    s.queue(null);
                    removed ++;
                    this._readStreams.splice(i, 1);
                }
            }
            if (this._readStreams.length === 0) {
                this._reading = false;
            }
            if (removed > 0) this.emit('read-close');
        }
        for (var i = 0; i < this._readStreams.length; i++) {
            var s = this._readStreams[i];
            if (s._level !== undefined && lex[1].length) s.queue(lex[1]);
        }
    }
    
    if (this._writing === 'next') {
        this._writing = false;
        this.emit('_write-end');
    }
    else if (this._writing && lex[0] === 'closetag') {
        var level = this._matcher.matchers[0].stack.length;
        if (level === this._writeLevel) {
            if (this._writeStream.outer) {
                this._writing = 'next';
            }
            else {
                this._writing = false;
                this.emit('_write-end');
            }
        }
    }
    
    var matching = this._matcher.at(lex[0], lex[2]);
    if (matching) {
        for (var i = 0; i < this._readStreams.length; i++) {
            var rs = this._readStreams[i];
            if (rs.outer && lex[1].length) rs.queue(lex[1]);
        }
    }
};

Result.prototype.setAttribute = function (key, value) {
    var sub = Buffer(ent.encode(key) + '="' + ent.encode(value) + '"');
    this._setAttr[key.toUpperCase()] = sub;
    return this;
};

Result.prototype.removeAttribute = function (key) {
    this._rmAttr[key.toUpperCase()] = true;
    return this;
};

Result.prototype.getAttribute = function (key, cb) {
    this._getAttr[key.toUpperCase()] = cb;
};

Result.prototype.createWriteStream = function (opts) {
    if (!opts) opts = {};
    var stream = through().pause();
    if (opts.outer) stream.outer = true;
    this._writeStream = stream;
    return stream;
};

Result.prototype.createReadStream = function (opts) {
    if (!opts) opts = {};
    var stream = through();
    if (opts.outer) stream.outer = true;
    this._readStreams.push(stream);
    return stream;
};

Result.prototype.createStream = function (opts) {
    var ws = Result.prototype.createWriteStream.call(this, opts);
    ws._skipping = false;
    var rs = Result.prototype.createReadStream.call(this, opts);
    return duplexer(ws, rs);
};
