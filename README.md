harmon
======

A middleware component for [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) using [trumpet](https://github.com/substack/node-trumpet) to parse and transform the response from the proxied server.

[![build status](https://secure.travis-ci.org/No9/harmon.png)](http://travis-ci.org/No9/harmon)

With apologies to [substack](https://github.com/substack/) & [nodejitsu](https://github.com/nodejitsu)

![harmon](http://i.imgur.com/nQ0t1.jpg)

examples
========

simple
------
### Overview
------------
In this example the following HTML:
``` html
<html>
	<head></head>
	<body>
		<div class="a">Nodejitsu Http Proxy</div>
		<div class="b">&amp; Frames</div>
	</body>
</html>
```
Is returned from the remote server and parsed.  
The following line: 
``` html
<div class="b">&amp; Frames</div> 
```
Is replaced with: 
``` html 
<div>+ Trumpet</div>
``` 
### Run It! 
----------- 
```
$ cd examples
$ node simple.js
```
Browse to [localhost:8000](http://localhost:8000) and you should see:

![simple output](http://i.imgur.com/Gpbzt.png)

### Code
--------
``` js
var http = require('http'),
    httpProxy = require('http-proxy');

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
  require('../').harmon(selects),
  9000, 'localhost'
).listen(8000);

// Create a simple web server for the proxy to send requests to and manipulate the data from
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
  res.end();
}).listen(9000); 
```
See [trumpet](https://github.com/No9/node-trumpet#update) for the types of queries and functions you can pass.