var test = require('tape');
var trumpet = require('../');
var through = require('through');
var concat = require('concat-stream');
var fs = require('fs');
var expected = fs.readFileSync(__dirname + '/loud_expected.html', 'utf8');

test('loud', function (t) {
    t.plan(1);
    var tr = trumpet();

    var loud = tr.select('.loud').createStream();
    loud.pipe(through(function (buf) {
        this.queue(buf.toString().toUpperCase());
    })).pipe(loud);
    
    fs.createReadStream(__dirname + '/loud.html')
        .pipe(tr)
        .pipe(concat(function (src) {
            t.equal(src.toString('utf8'), expected);
        }))
    ;
});
