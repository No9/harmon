var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('special tags', function (t) {
    t.plan(10);
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/special.html').pipe(tr);
    
    tr.select('.a .b', function (node) {
        node.html(function (html) {
            t.equal(html, 'boop');
        });
    });
    
    tr.select('.c .d', function (node) {
        node.html(function (html) {
            t.equal(html, 'wooo');
        });
    });
    
    var types = [ 'text', 'text', 'password', 'submit' ];
    tr.select('input', function (node) {
        t.equal(node.attributes.type, types.shift());
    });
    
    tr.select('hr + input', function (node) {
        t.equal(node.attributes.type, 'submit');
    });
    
    tr.select('br + .d', function (node) {
        node.html(function (html) {
            t.equal(html, 'wooo');
        });
    });
    
    tr.select('img + .b', function (node) {
        node.html(function (html) {
            t.equal(html, 'boop');
        });
    });
    
    tr.select('.d + hr', function (node) {
        t.equal(node.name, 'hr');
    });
});
