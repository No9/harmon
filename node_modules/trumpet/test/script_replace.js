var test = require('tap').test;
var trumpet = require('../');
var fs = require('fs');

test('script replace', function (t) {
    var html = fs.readFileSync(__dirname + '/script_replace_target.html', 'utf8');
    
    var tr = trumpet();
    fs.createReadStream(__dirname + '/script_replace.html').pipe(tr);
    
    tr.select('script', function (node) {
        node.replace(function (html) {
            return '<script>beepBoop()</script>';
        });
    });
    
    var data = '';
    tr.on('data', function (buf) { data += buf });
    
    tr.on('end', function () {
        t.equal(data, html);
        t.end();
    });
});
