var trumpet = require('../');
var tr = trumpet();

tr.select('.b span', function (node) {
    node.html(function (html) {
        console.log(node.name + ': ' + html);
    });
});

var fs = require('fs');
fs.createReadStream(__dirname + '/select.html').pipe(tr);
