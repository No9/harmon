var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('script', function (t) {
    t.plan(2);
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/script.html').pipe(tr);
    
    tr.select('script', function (node) {
        t.equal(node.attributes.type, 'text/javascript');
        node.html(function (src) {
            t.equal(src, 'console.log(i<j)');
            t.end();
        });
    });
});
