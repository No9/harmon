var assert = require('assert'),
    http = require('http'),
    httpProxy = require('http-proxy');

	var testcount = 0;
// Create an array of selects that harmon will process. 
var actions = [];

// Create a simple action
var simpleaction = {};

// Select a node by its class name. You can also select by tag e.g. 'div'
simpleaction.query = '.b';

// Create an function that is executed when that node is selected. Here we just replace '& frames' with '+trumpet' 
simpleaction.func = function (node) {
                        node.replace(function (html) {
                            return '<div>+ Trumpet</div>';
                        });
                    } 

// Add the action to the action array
actions.push(simpleaction);

// Create a node-http-proxy configured with our harmon middleware
httpProxy.createServer(
  require('../').harmon(actions),
  9000, 'localhost'
).listen(8000);

// Create a simple web server for the proxy to send requests to and manipulate the data from
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
  res.end();
}).listen(9000); 

var options = {
  host: "localhost",
  port: 8000,
  path: "/",
  headers: {}
};
http.get(options, function(res) {
  //console.log(res.toString());
  var out = "";
  res.on('data', function(buf)
  {
	out+= buf;
  });
  
  res.on('end', function()
  {
	assert.equal('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div>+ Trumpet</div></body></html>', out);
    console.log("Executed the simple test");
	testcount++;
	assert.equal(1, testcount);
	console.log("Test Complete");
	process.exit(0);
  });
  //
  //res.pipe(process.stdout);
});
	
