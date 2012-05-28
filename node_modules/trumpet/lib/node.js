var ent = require('ent');

module.exports = function (tag, sel, level) {
    return new Node(tag, sel, level);
};

function expire () {
    throw new Error('Parse expired. You had your chance.');
}

function Node (tag, sel, level) {
    this.name = tag.name.toLowerCase();
    this.attributes = tag.attributes;
    this.p = { level : level };
    
    this.tag = tag;
    this.sel = sel;
}

Node.prototype.html = function (cb) {
    var p = this.p, sel = this.sel;
    if (this.expired) expire();
    
    p.buffered = '';
    p.callback = cb;
    p.writes = 0;
    sel.pending.push(p);
};

Node.prototype.update = function (cb, attrs) {
    var self = this;
    var p = self.p, sel = self.sel;
    if (self.expired) expire();
    if (typeof cb === 'object') {
        attrs = cb;
        cb = String; // identify function
    }
    
    if (attrs) {
        var attrText = Object.keys(attrs).map(function (key) {
            return key + '="' + ent.encode(attrs[key]) + '"'
        }).join(' ');
        
        if (attrText.length) attrText = ' ' + attrText;
        var isSpecial = sel.special.indexOf(self.name) >= 0;
        
        p.buffered = '';
        p.callback = function (html, final) {
            var this_ = this;
            final(function (s) {
                var d = typeof cb === 'function' ? cb(html) : cb;
                var data = '<' + self.name + attrText + '>' + d;
                this_.emit('data', data + s);
            });
            sel.updating = false;
        };
        sel.updating = true;
        sel.removing = true;
        sel.pending.push(p);
        p.writes = 0;
        
        return;
    }
    
    p.buffered = '';
    p.callback = function (html) {
        this.emit('data',
            typeof cb === 'function' ? cb(html) : cb
        );
        sel.updating = false;
    };
    p.writes = 0;
    sel.updating = true;
    sel.pending.push(p);
};

Node.prototype.replace = function (cb) {
    var p = this.p, sel = this.sel;
    if (this.expired) expire();
    
    p.buffered = '';
    p.callback = function (html, final) {
        var this_ = this;
        final(function (s) {
            var data = typeof cb === 'function' ? cb(html + s) : cb;
            this_.emit('data', data);
        });
        sel.updating = false;
    };
    sel.updating = true;
    sel.removing = true;
    sel.pending.push(p);
};

Node.prototype.remove = function () {
    var p = this.p, sel = this.sel;
    if (this.expired) expire();
    sel.updating = true;
    sel.removing = true;
    p.callback = function () {
        sel.updating = false;
    };
    sel.pending.push(p);
};
