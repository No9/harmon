var http = require('http'),
    httpProxy = require('http-proxy'),
    colors = require('colors'),
    connect = require('connect');

var selects = [];
var simpleselect = {};

simpleselect.query = 'head';
simpleselect.func = function (node) {
	
    var out = '<style type="text/css"> img { ';
    out +='-webkit-transform: rotate(-90deg); ';
    out += '-moz-transform: rotate(-90deg); ';
    out += 'filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);}</style>';
	
	var rs = node.createReadStream();
	var ws = node.createWriteStream({outer: false});
	
	// Read the node and put it back into our write stream, 
	// but don't end the write stream when the readStream is closed.
	rs.pipe(ws, {end: false});
	
	// When the read stream has ended, attach our style to the end
	rs.on('end', function(){
		ws.end(out);
	});
} 

selects.push(simpleselect);

//
// Basic Connect App
//

var app = connect();

var proxy = httpProxy.createProxyServer({
   target: 'http://localhost:9000'
})

app.use(require('../')([], selects));
app.use(function (req, res) {
         proxy.web(req, res);
      })



http.createServer(app).listen(8000);


http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  var output =  '<html><head><script>'
      output += 'window.onload = function () {'
      output += 'document.getElementById("message").innerHTML = "The piece of javascript also inside the head tag wasn\'t touched :)";';
      output += '}</script></head><body><h3>A simple example of injecting some css to rotate an image into a page before it is rendered.</h3>'
      output += '<image src="http://i.imgur.com/fpMGL.png" /><div id="message"></div></body></html>';
  res.end(output);
}).listen(9000); 
