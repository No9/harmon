var test = require("tap").test;
var assert = require('assert');
var http = require('http');
var httpProxy = require('http-proxy');
var connect = require('connect');

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

var action2 = {};
action2.query = '.a';

// Create an function that is executed when that node is selected. Here we just replace '& frames' with '+trumpet' 
action2.func = function (node) {
    test("Request Test", function (t) {
        t.plan(1);
        t.ok(true, "Request Selector Has Been Called");
        t.end();
    });
    node.createWriteStream({outer : true }).end('<div>Harmon Middleware</div>');
} 

//Turning this off for now
//var reqactions = [];
actions.push(action2);


var con1 = connect();
con1.use(require('../')([], actions));
con1.use(function (req, res) {
            proxy1.web(req, res);
         })

var consvr1 = http.createServer(con1).listen(8000);

var proxy1 = httpProxy.createProxyServer({
   target: 'http://localhost:9000'
})

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
      assert.equal('<html><head></head><body><div>Harmon Middleware</div><div>+ Trumpet</div></body></html>', out);
      console.log("# Content Returned Correct");
      consvr1.close();
      server1.close();
      proxy1 = null;
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
        var s = '<body><p>hi</p></body>';

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-length', '' + s.length);  // All ASCII today
        res.end(s);
    }).listen(9001);

    var sizeChanger = {} ;
        sizeChanger.query = 'p';
        sizeChanger.func = function (elem) {
            ws = elem.createWriteStream({outer: true})
            ws.end('<p>A larger paragraph</p>');
        }
    
    var con2 = connect();

    con2.use(require('../')([], [sizeChanger]));
    con2.use(function (req, res) {
        proxy.web(req, res);
      }
    )
   
    var consvr2 = http.createServer(con2).listen(8001);

    var proxy = httpProxy.createProxyServer({
        target: 'http://localhost:9001'
    })
/*
    var proxy2 = httpProxy.createServer(
        require('../')(null, [sizeChanger]),
        9001, 'localhost'
    ).listen(8001);
*/
    http.get('http://localhost:8001', function (res) {
        var str = '';  // yeah well it's all ASCII today.

        res.on('data', function (data) {
            console.log("'data'", data + '');
            str += data;
        });

        res.on('end', function () {
            t.equal(str, '<body><p>A larger paragraph</p></body>');
            server2.close();
            consvr2.close();
            t.end();
        });
    });
});

test('Only text/html should be altered.', function (t) {
    t.plan(1);

    var server2 = http.createServer(function (req, res) {
        var s = '<body><p>hi</p></body>';
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-length', '' + s.length);  // All ASCII today
        res.end(s);
    }).listen(9001);

    var ignoredSelector = {} ;

    ignoredSelector.query = 'p';
    ignoredSelector.func = function (elem) {
      ws = elem.createWriteStream({outer: true})
      ws.end('<p>A larger paragraph</p>');
    }

    var con2 = connect();

    con2.use(require('../')([], [ignoredSelector], true));

    con2.use(function (req, res) {
        proxy2.web(req, res);
      }
    )

    var consvr2 = http.createServer(con2).listen(8001);

    var proxy2 = httpProxy.createProxyServer({
        target: 'http://localhost:9001'
    })

    http.get('http://localhost:8001', function (res) {
        var str = '';  // yeah well it's all ASCII today.

        res.on('data', function (data) {
            console.log("'data'", data + '');
            str += data;
        });

        res.on('end', function () {
            // Should not be modified since server indicated that content type is not HTML
            t.equal(str, '<body><p>hi</p></body>');
            server2.close();
            consvr2.close();
            t.end();
        });
    });
});