var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var SPECIAL = {
    AREA: true,
    BASE: true,
    BASEFONT: true,
    BR: true,
    COL: true,
    HR: true,
    INPUT: true,
    IMG: true,
    LINK: true,
    META: true
};

module.exports = function (selector) {
    var group = new EventEmitter;
    var matchers = group.matchers = [ create() ];
    
    group.at = function (kind, node) {
        var r = false;
        for (var i = 0; i < matchers.length; i++) {
            var r_ = matchers[i].at(kind, node);
            r = r || r_;
        }
        return r;
    };
    return group;
    
    function create () {
        var m = new Match(selector);
        
        m.on('open', group.emit.bind(group, 'open'));
        m.on('pre-open', group.emit.bind(group, 'pre-open'));
        m.on('tag-end', group.emit.bind(group, 'tag-end'));
        m.on('attribute', group.emit.bind(group, 'attribute'));
        
        m.on('unmatch', function () {
            if (matchers.length > 1) {
                var ix = matchers.indexOf(this);
                matchers.splice(ix, 1);
            }
            group.emit('unmatch');
        });
        
        m.on('fork', function (node) {
            var m = create();
            matchers.push(m);
            group.emit('fork', node)
            m.at(node);
        });
        
        return m;
    }
};

function Match (selector) {
    this.selector = selector;
    this.index = 0;
    this.current = null;
    this.matched = false;
    this.startLevel = null;
    this.stack = [];
    this.operator = null;
}

inherits(Match, EventEmitter);

Match.prototype.next = function () {
    if (/^[>\+]$/.test(this.selector[this.index+1])) {
        this.operator = this.selector[++this.index];
    }
    else {
        this.operator = ' ';
    }
    
    if (++ this.index === this.selector.length) {
        this.matched = true;
        this.emit('pre-open', this);
        this.emit('open', this);
        return true;
    }
};

Match.prototype.unmatch = function () {
    this.current = null;
    this.matched = false;
    this.index = 0;
    this.startLevel = null;
};

Match.prototype.at = function (kind, node) {
    var sel = this.selector[this.index];
    if (!sel && kind === 'tag-end') {
        if (this.matched) this.emit('tag-end', this);
        this.emit('unmatch');
        if (this.matched) {
            this.matched = false;
            this._previouslyMatched = true;
            this.index --;
            return true;
        }
        else return this.unmatch();
    }
    
    if (kind === 'tag-begin' && !node.isSelfClosing
    && !SPECIAL[node.name]) {
        this.stack.push(node.name);
    }
    else if (kind === 'closetag') {
        for (var i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i] === node) {
                this.stack.splice(i);
                break;
            }
        }
        if (this.operator === '+') {
            if (this.stack.length < this.startLevel) {
                this.unmatch();
            }
        }
        else if (this._previouslyMatched) {
            if (this.stack.length < this.startLevel) {
                this.unmatch();
            }
        }
        else if (this.stack.length < this.startLevel
        && this.startLevel !== null) {
            this.unmatch();
        }
    }
    
    if (kind === 'tag-begin') {
        this._previouslyMatched = false;
        
        var matched = matchSelector(sel, node);
        if (matched) {
            this.current = node;
            var fork = false;
            if (this.index === 0) {
                this.startLevel = this.stack.length;
            }
            else if (matchSelector(this.selector[0], node)) {
                fork = true;
            }
            var res = this.next();
            if (fork) this.emit('fork', node);
            return res;
        }
        else if (this.operator === '>') {
            this.unmatch();
        }
    }
    else if (this.matched) {
        if (kind === 'tag-end') {
            this.emit(kind, this)
        }
        else this.emit(kind, node)
        return true;
    }
};

function matchSelector (sel, node) {
    if (!sel) return false;
    if (sel.name !== null && sel.name !== '*' && node.name !== sel.name) {
        return false;
    }
    var pendingCount = 0;
    var p = {
        class: sel.class.length && sel.class.slice(),
        id: sel.id,
        pseudo: sel.pseudo,
        exists: sel.attribute.exists,
        equals: sel.attribute.equals,
        contains: sel.attribute.contains,
        begins: sel.attribute.begins,
        prefixed: sel.attribute.prefixed,
        suffixed: sel.attribute.suffixed,
        containsAnywhere: sel.attribute.containsAnywhere
    };
    var pendingCount = Boolean(p.class) + Boolean(p.id)
        + Boolean(p.pseudo) + Boolean(p.exists) + Boolean(p.equals)
        + Boolean(p.contains) + Boolean(p.begins)
        + Boolean(p.prefixed) + Boolean(p.suffixed) + Boolean(p.containsAnywhere)
        ;
    if (pendingCount === 0) return true;
    
    if (p.class && node.attributes.CLASS) {
        var clist = p.class;
        var classes = node.attributes.CLASS.split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            var ix = clist.indexOf(classes[i]);
            if (ix >= 0) {
                clist.splice(ix, 1);
                if (clist.length === 0) {
                    if (satisfied('class')) return true;
                }
            }
        }
    }

    if (p.id && p.id === node.attributes.ID) {
        if (satisfied('id')) return true;
    }
    if (p.exists && node.attributes[p.exists.toUpperCase()] !== undefined) {
        if (satisfied('exists')) return true;
    }
    
    var x;
    if (p.equals && (x = node.attributes[p.equals[0].toUpperCase()])) {
        if (x === p.equals[1]) {
            if (satisfied('equals')) return true;
        }
    }
    if (p.contains && (x = node.attributes[p.contains[0].toUpperCase()])) {
        if (x.split(/\s+/).indexOf(p.contains[1]) >= 0) {
            if (satisfied('contains')) return true;
        }
    }
    if (p.begins && (x = node.attributes[p.begins[0].toUpperCase()])) {
        if (x.split('-')[0] === p.begins[1]) {
            if (satisfied('begins')) return true;
        }
    }
    if (p.prefixed && (x = node.attributes[p.prefixed[0].toUpperCase()])) {
        if (x.slice(0, p.prefixed[1].length) === p.prefixed[1]) {
            if (satisfied('prefixed')) return true;
        }
    }
    if (p.suffixed && (x = node.attributes[p.suffixed[0].toUpperCase()])) {
        if (x.indexOf(p.suffixed[1], x.length - p.suffixed[1].length) !== -1) {
            if (satisfied('suffixed')) return true;
        }
    }
    if (p.containsAnywhere && (x = node.attributes[p.containsAnywhere[0].toUpperCase()])) {
        if (x.indexOf(p.containsAnywhere[1]) !== -1) {
            if (satisfied('containsAnywhere')) return true;
        }
    }
    
    return false;
    
    function satisfied (name) {
        if (!p[name]) return false;
        p[name] = null;
        if (--pendingCount === 0) return true;
    }
};
