var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('attr update', function (t) {
    var html = fs.readFileSync(__dirname + '/attr_target.html', 'utf8');
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/attr.html').pipe(tr);
    
    var names = [ 'foo', 'bar', 'baz' ];
    var attrMap = { foo : 'X', bar : 'YY', baz : 'ZZZ' };
    
    tr.select('.b span', function (node) {
        var attrs = node.attributes;
        var name = names.shift();
        t.ok(attrs[name]);
        attrs[name] = attrMap[name];
        
        node.update(function (html) {
            return '¡' + html.toUpperCase() + '!';
        }, attrs);
    });
    
    var data = '';
    tr.on('data', function (buf) { data += buf });
    
    tr.on('end', function () {
        t.equal(data, html);
        t.end();
    });
});
