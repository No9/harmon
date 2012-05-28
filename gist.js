var http = require('http'),
    httpProxy = require('http-proxy'),
    trumpet = require('trumpet');

httpProxy.createServer(
  function (req, res, next) {
    
    var _write = res.write;
    
    res.write = function (data) {
          var tr = trumpet();
            
            tr.select('.b', function (node) {
               node.replace(function (html) {
                return '<div>& Trumpet</div>';
               });
            });

            tr.on('data', function (buf) { 
              _write.call(res, buf);
            });
            
            tr.write(data);
    }
    next();
  },
  9000, 'localhost'
).listen(8000);

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  //res.write('<body>old</body>request successfully proxied: ' + req.url +'\n' + JSON.stringify(req.headers, true, 2));
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">& Frames</div></body></html>');
  res.end();
}).listen(9000); 