var trumpet = require('../');
var tr = trumpet();
 
tr.update('.b span', function (html, node) {
    return html.toUpperCase();
});

tr.update('.c', '---');
tr.remove('.d');
tr.remove('.e');

var fs = require('fs');
tr.pipe(process.stdout, { end : false });
fs.createReadStream(__dirname + '/update.html').pipe(tr);
