var http = require('http'),
    httpProxy = require('http-proxy');

var selects = [];
var simpleselect = {};

simpleselect.query = 'head';
simpleselect.func = function (node) {
               			node.update(function (html) {
                			var out = '<style type="text/css"> img { ';
								out +='-webkit-transform: rotate(-90deg); ';
								out += '-moz-transform: rotate(-90deg); ';
								out += 'filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);}</style>';
								out += html;
								return out;
               			});
            		} 

selects.push(simpleselect);

httpProxy.createServer(
  require('../').harmon(selects),
  9000, 'localhost'
).listen(8000);

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  output = '<html><head><script>'
  output += 'window.onload = function () {'
  output += 'document.getElementById("message").innerHTML = "The piece of javascript also inside the head tag wasn\'t touched :)";';
  output +=	'}</script></head><body><h3>A simple example of injecting some css to rotate an image into a page before it is rendered.</h3>'
  output += '<image src="http://i.imgur.com/fpMGL.png" /><div id="message"></div></body></html>';
  res.end(output);
}).listen(9000); 