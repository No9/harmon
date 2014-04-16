var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy');


var selects = [];
var simpleselect = {};

simpleselect.query = '.b';
simpleselect.func = function (node) {
    node.createWriteStream().end('<div>+ Trumpet</div>');
}

selects.push(simpleselect);

//
// Basic Connect App
//
connect.createServer(
  require('../')([], selects),
  function (req, res) {
    proxy.web(req, res);
  }
).listen(8000);

var proxy = httpProxy.createProxyServer({
   target: 'http://localhost:9000'
})

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
  res.end();
}).listen(9000); 
