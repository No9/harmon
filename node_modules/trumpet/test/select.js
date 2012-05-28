var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('select', function (t) {
    t.plan(11);
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/select.html').pipe(tr);
    
    var spans = [ 'tacos', 'y', 'burritos' ];
    
    tr.select('.b span', function (node) {
        t.deepEqual(node.attributes, {});
        node.html(function (html) {
            t.equal(html, spans.shift());
        });
    });
    
    var as = [ '¡¡¡', '!!!' ];
    tr.select('.a', function (node) {
        t.deepEqual(node.attributes, { class : 'a' });
        node.html(function (html) {
            t.equal(html, as.shift());
        });
    });
    
    tr.select('.c', function (node) {
        node.html(function (html) {
            t.equal(html, '<b>beep</b><i>boop</i>');
        });
    });
});
