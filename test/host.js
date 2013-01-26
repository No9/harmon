var test = require("tap").test;
var assert = require('assert');
var http = require('http');
var httpProxy = require('http-proxy');

  
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

var reqaction = {};
reqaction.query = '.a';

// Create an function that is executed when that node is selected. Here we just replace '& frames' with '+trumpet' 
reqaction.func = function (node) {
                        node.replace(function (html) {
							test("Request Test", function (t) {
								t.plan(1);
								t.ok(true, "Request Selector Has Been Called");
								t.end();
							});
                            return '<div>Nearform Middleware</div>';
                        });
                    } 

var reqactions = [];
reqactions.push(reqaction);


// Create a node-http-proxy configured with our harmon middleware
httpProxy.createServer(
  require('../')(reqactions, actions),
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

/*Simple Request Test*/
http.get(options, function(res) {
  //console.log(res.toString());
  var out = "";
  res.on('data', function(buf)
  {
	out+= buf;
  });
  
  res.on('end', function()
  {
    test("Response Test", function (t) {
		t.plan(1);
		t.equal('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div>+ Trumpet</div></body></html>', out, "Response Correct");
		t.ok(true, "Response Selector Has Been Called");
		t.end();
    });
	process.exit(0);
  });
});
	
var options = {
   host: 'localhost',
   port: 8000,
   path: '/',
   method: 'POST'
};

var req = http.request(options, function(res) {
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
req.end();

