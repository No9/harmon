var ATTR_RE = RegExp(
    '\\[([^=~|^$*\\]]+)\\s*(?:([\\|~^$*]=|=)\\s*'
    + '("(?:[^"]|\\")+"|'
    + "(?:'(?:[^']|\\')+')|[\\w-]+))?\\]"
);

module.exports = function (selector) {
    return split(selector).map(function (s) {
        if (s === '>' || s === '+') return s;
        
        var m = {
            name: s.match(/^([\w-]+|\*)/),
            'class': s.match(/\.[\w-]+/g),
            id: s.match(/#([\w-]+)/),
            pseudo: s.match(/:([\w-]+)/),
            attribute: s.match(ATTR_RE)
        };
        var classes = (m['class'] || []).map(function (c) {
            return c.replace(/^\./, '');
        });
        
        var res = {
            name: m.name && m.name[1].toUpperCase(),
            'class': classes,
            id: m.id && m.id[1],
            pseudo: m.pseudo && m.pseudo[1],
            attribute: {}
        };
        
        if (!m.attribute) return res;
        
        var name = m.attribute[1];
        var op = m.attribute[2];
        if (!op) {
            res.attribute.exists = name;
            return res;
        }
        var key = {
            '=': 'equals',
            '~=': 'contains',
            '|=': 'begins',
            '^=': 'prefixed',
            '$=': 'suffixed',
            '*=': 'containsAnywhere'
        }[op];
        
        var value = m.attribute[3];
        if (/^"/.test(value)) {
            value = value.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        }
        else if (/^'/.test(value)) {
            value = value.replace(/^'|'$/g, '').replace(/\\'/g, "'");
        }
        res.attribute[key] = [ name, value ];
        
        return res;
    }).filter(Boolean);
};

function split (s) {
    var res = [];
    var escaped = false;
    var quoted = false;
    var expr = false;
    var last = 0;
    for (var i = 0; i < s.length; i++) {
        var c = s.charAt(i);
        if (quoted) {
            if (escaped) {
                escaped = false;
            }
            else if (c === quoted) {
                quoted = false;
            }
        }
        else if (c === '"' || c === "'") {
            quoted = c;
        }
        else if (c === '[') {
            expr = true;
        }
        else if (expr) {
            if (c === ']') expr = false;
        }
        else if (/[\s>+]/.test(c)) {
            res.push(s.slice(last, i));
            last = i;
            
            for (++i; /[\s>+]/.test(s.charAt(i)); i++);
            res.push(s.slice(last, i).trim());
            last = i;
        }
    }
    if (last !== i) {
        res.push(s.slice(last, i));
    }
    return res.filter(Boolean);
}
