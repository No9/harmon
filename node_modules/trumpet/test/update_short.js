var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('update', function (t) {
    t.plan(6);
    var html = fs.readFileSync(__dirname + '/update_target.html', 'utf8');
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/update.html').pipe(tr);
    
    var spans = [ 'tacos', 'y', 'burritos' ];
    
    tr.update('.b span', function (html, node) {
        t.equal(node.name, 'span');
        return html.toUpperCase();
    });
    
    tr.update('.c', '---');
    tr.remove('.d');
    tr.remove('.e');
    tr.replace('.f', '<b>NOTHING TO SEE HERE</b>');
    
    tr.replace('.g', function (html, node) {
        t.equal(node.name, 'div');
        t.same(node.attributes, { class : 'g' });
        t.equal(html, '<div class="g">EVERYTHING IS TERRIBLE</div>');
        return '<blink>TERRIBLE</blink>';
    });
    
    var data = '';
    tr.on('data', function (buf) { data += buf });
    
    tr.on('end', function () {
        t.equal(data, html);
    });
});
