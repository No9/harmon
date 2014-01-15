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
    node.createWriteStream({ outer: true })
        .end('<div>+ Trumpet</div>');
}

// Add the action to the action array
actions.push(simpleaction);

var reqaction = {};
reqaction.query = '.a';

// Create an function that is executed when that node is selected. Here we just replace '& frames' with '+trumpet' 
reqaction.func = function (node) {
    test("Request Test", function (t) {
        t.plan(1);
        t.ok(true, "Request Selector Has Been Called");
        t.end();
    });
    node.createWrteStream.end('<div>Nearform Middleware</div>');
} 

var reqactions = [];
reqactions.push(reqaction);


// Create a node-http-proxy configured with our harmon middleware
var proxy1 = httpProxy.createServer(
  require('../')(reqactions, actions),
  9000, 'localhost'
).listen(8000);

// Create a simple web server for the proxy to send requests to and manipulate the data from
var server1 = http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
  res.end();
}).listen(9000); 


	
var options = {
   host: 'localhost',
   port: 8000,
   path: '/',
   method: 'POST'
};

var req = http.request(options, function(res) {
  res.setEncoding('utf8');
  var out = "";
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
	out+= chunk;
  });
  
  res.on('end', function(){
	assert.equal('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div>+ Trumpet</div></body></html>', out);
	console.log("# Content Returned Correct");
    server1.close();
    proxy1.close();
	});
	
  res.on('close', function(){
	console.log("CLOSE");
	});
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.on('close', function(){
	console.log("END");
	});
	
// write data to request body
req.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
req.end();

test('Streams can change the response size', function (t) {
    t.plan(1);

    var server2 = http.createServer(function (req, res) {
        s = '<body><p>hi</p></body>';
        res.setHeader('Content-length', '' + s.length);  // All ASCII today
        res.end(s);
    }).listen(9001);

    var sizeChanger = {
        query: 'p',
        func: function (elem) {
            ws = elem.createWriteStream({outer: true})
            ws.end('<p>A larger paragraph</p>');
        }
    };
    var proxy2 = httpProxy.createServer(
        require('../')(null, [sizeChanger]),
        9001, 'localhost'
    ).listen(8001);

    http.get('http://localhost:8001', function (res) {
        var str = '';  // yeah well it's all ASCII today.
        res.on('data', function (data) {
            console.log("'data'", data + '');
            str += data;
        });
        res.on('end', function () {
            t.equal(str, '<body><p>A larger paragraph</p></body>');
            proxy2.close();
            server2.close();
            t.end();
        });
    });
});


