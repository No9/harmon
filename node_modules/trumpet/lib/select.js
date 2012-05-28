var Stream = require('stream').Stream;
var createNode = require('./node');

module.exports = function (parser, opts) {
    var stream = new Stream;
    stream.writable = true;
    stream.readable = true;
    
    var selectors = [];
    
    stream.select = function (s, fn) {
        var sel = createSelector(s, fn, opts.special);
        selectors.push(sel);
        return stream;
    };
    
    stream.update = function (s, fn) {
        return stream.select(s, function (node) {
            if (typeof fn === 'function') {
                node.update(function (html) { return fn(html, node) });
            }
            else node.update(fn);
        });
    };
    
    stream.remove = function (s, fn) {
        return stream.select(s, function (node) {
            node.remove();
            if (typeof fn === 'function') fn(node);
        });
    };
    
    stream.replace = function (s, fn) {
        return stream.select(s, function (node) {
            if (typeof fn === 'function') {
                node.replace(function (html) { return fn(html, node) });
            }
            else node.replace(fn);
        });
    };
    
    var updating = false;
    
    stream.pre = function (name, t) {
        if (name === 'open') {
            selectors.forEach(function (sel) {
                sel(t, parser)
                if (sel.removing) updating = true;
            });
        }
        else if (name === 'close') {
            var level = parser.tags.reduce(function (sum, t) {
                return sum + (opts.special.indexOf(t.name) < 0 ? 1 : 0);
            }, 0);
            
            selectors.forEach(function (sel) {
                var up = sel.updating;
                sel.pending = sel.pending.filter(function (p) {
                    var done = level < p.level;
                    if (done && sel.removing) {
                        p.callback.call(stream, p.buffered, function (cb) {
                            sel.nextRaw.push(cb);
                        });
                    }
                    else if (done) p.callback.call(stream, p.buffered);
                    return !done;
                });
                
                if (up && !sel.updating) {
                    if (sel.removing) {
                        sel.removeOnPost = true;
                    }
                    else updating = false;
                }
            });
        }
    };
    
    stream.post = function (name, t) {
        if (name === 'open') {
            selectors.forEach(function (sel) {
                if (sel.updating) {
                    updating = true;
                }
                sel.pending.forEach(function (p) {
                    if (p.writes === 0) {
                        p.buffered = '';
                    }
                    if (typeof p.writes === 'number') p.writes ++;
                });
            });
            
            for (var i = 0; i < parser.tags.length; i++) {
                var t = parser.tags[i];
                if (opts.special.indexOf(t.name) >= 0) {
                    parser.tags.splice(i, 1);
                    i--;
                }
            }
        }
        else if (name == 'close') {
            selectors.forEach(function (sel) {
                if (sel.removeOnPost) {
                    updating = false;
                    sel.removing = false;
                    sel.removeOnPost = false;
                }
            });
        }
    };
    
    stream.raw = function (s) {
        selectors.forEach(function (sel) {
            sel.nextRaw.splice(0).forEach(function (cb) { cb(s) });
            
            sel.pending.forEach(function (p) {
                p.buffered += s;
            });
        });
        
        if (!updating) stream.emit('data', s);
    };
    
    return stream;
};

function createSelector (selector, fn, special) {
    var saveSiblings = false;
    var parts = selector.split(/([\s>+]+)/).map(function (s) {
        if (s.match(/^\s+$/)) return;
        
        var op = s.trim();
        if (op === '+') saveSiblings = true;
        if (op === '>' || op === '+') return { combinator : op };
        
        var m = {
            name : s.match(/^([\w-]+|\*)/),
            class : s.match(/\.([\w-]+)/),
            id : s.match(/#([\w-]+)/),
            pseudo : s.match(/:([\w-]+)/),
            attribute : s.match(/\[([^\]]+)\]/),
        };
        
        return {
            name : m.name && m.name[1].toUpperCase(),
            class : m.class && m.class[1],
            id : m.id && m.id[1],
            pseudo : m.pseudo && m.pseudo[1],
            attribute : m.attribute && m.attribute[1],
        };
    }).filter(Boolean);
    
    var depth = parts.reduce(function (sum, s) {
        return sum + (s.combinator ? 0 : 1);
    }, 0);
    
    var siblings = [];
    
    var sel = function (tag, parser) {
        var tags = parser.tags;
        
        if (!siblings[tags.length]) siblings[tags.length] = [];
        siblings[tags.length].push(tag);
        
        if (depth > tags.length) return;
        
        // hypothesis: the selector matches
        var j = parts.length - 1;
        var i = tags.length - 1;
        
        function check (t, p) {
            // try to falsify the hypothesis on each tag/part match:
            if (p.name !== '*' && p.name && p.name !== t.name) return false;
            if (p.class && p.class !== t.attributes.class) return false;
            if (p.id && p.id !== t.attributes.id) return false;
            return true;
        }
        
        for (; j >= 0; j--, i--) {
            var t = tags[i];
            var p = parts[j];
            if (p.combinator === '>') {
                for (var ii = i; ii >= 0; ii--) {
                    if (check(tags[ii], parts[j-1])) {
                        break;
                    }
                }
                if (ii < 0) return;
                j -= 2;
            }
            else if (p.combinator === '+') {
                var ts = siblings[i + 2];
                t = ts[ts.length - 2];
                if (!t) return;
                p = parts[j - 1];
                if (!check(t, p)) return;
                j -= 2;
            }
            else if (!check(t, p)) return;
        }
        
        var node = createNode(tag, sel, tags.length);
        fn(node);
        node.expired = true;
    };
    
    sel.special = special;
    sel.pending = [];
    sel.nextRaw = [];
    
    return sel;
}
