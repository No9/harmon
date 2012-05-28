var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('update', function (t) {
    t.plan(2);
    var html = fs.readFileSync(__dirname + '/update_target.html', 'utf8');
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/update.html').pipe(tr);
    
    var spans = [ 'tacos', 'y', 'burritos' ];
    
    tr.select('.b span', function (node) {
        node.update(function (html) {
            return html.toUpperCase();
        });
    });
    
    tr.select('.c', function (node) {
        node.update('---');
    });
    
    tr.select('.d', function (node) {
        node.remove();
    });
    
    tr.select('.e', function (node) {
        node.remove();
    });
    
    tr.select('.f', function (node) {
        node.replace('<b>NOTHING TO SEE HERE</b>');
    });
    
    tr.select('.g', function (node) {
        node.replace(function (html) {
            t.equal(html, '<div class="g">EVERYTHING IS TERRIBLE</div>');
            return '<blink>TERRIBLE</blink>';
        });
    });
    
    var data = '';
    tr.on('data', function (buf) { data += buf });
    
    tr.on('end', function () {
        t.equal(data, html);
    });
});
