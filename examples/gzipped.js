var http = require('http'),
  connect = require('connect'),
  httpProxy = require('http-proxy'),
  zlib = require('zlib');


var selects = [];
var simpleselect = {};

simpleselect.query = '.b';
simpleselect.func = function (node) {
  node.createWriteStream().end('<div>+ Trumpet</div>');
}

selects.push(simpleselect);

// Another select for Content-Encoding displaying
selects.push({
  query: '.c',
  func: function(node){
    node.createWriteStream().end('No Content-Encoding');
  }
});

//
// Basic Connect App
//
var app = connect();

var proxy = httpProxy.createProxyServer({
  target: 'http://localhost:9000'
})


app.use(require('../')([], selects));

app.use(
  function (req, res) {
    proxy.web(req, res);
  }
);

http.createServer(app).listen(8000);

http.createServer(function (req, res) {
  
  // Create gzipped content
  var gzip = zlib.Gzip();
  var _write = res.write;  
  var _end = res.end;
  
  gzip.on('data', function(buf){
    _write.call(res, buf);
  });  
  gzip.on('end', function(){
    _end.call(res);
  });
  
  res.write = function(data){
    gzip.write(data);
  };  
  res.end = function(){
    gzip.end();
  };    
  
  // Add Content-Encoding header
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Encoding': 'gzip'
  });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div><div class="c">Content-Encoding: gzip</div></body></html>');
  res.end();
  
}).listen(9000);
