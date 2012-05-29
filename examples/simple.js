var http = require('http'),
    httpProxy = require('http-proxy');

var selects = [];
var simpleselect = {};

simpleselect.query = '.b';
simpleselect.func = function (node) {
               			node.replace(function (html) {
                			return '<div>+ Trumpet</div>';
               			});
            		} 

selects.push(simpleselect);

httpProxy.createServer(
  require('../').harmon(selects),
  9000, 'localhost'
).listen(8000);

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
  res.end();
}).listen(9000); 