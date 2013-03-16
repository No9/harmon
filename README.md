#harmon

A middleware component for [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) using [trumpet](https://github.com/substack/node-trumpet) to parse and transform the response from the proxied server.

[![build status](https://secure.travis-ci.org/No9/harmon.png)](http://travis-ci.org/No9/harmon)

With apologies to [connect-gzip](https://github.com/nateps/connect-gzip)

![harmon](http://i.imgur.com/fpMGL.png)

##install

```
$ npm install harmon
```

## examples ##

### Overview ###
------------
In this example the HTML below is returned from the remote server and parsed:
``` html
<html>
	<head></head>
	<body>
		<div class="a">Nodejitsu Http Proxy</div>
		<div class="b">&amp; Frames</div>
	</body>
</html>
```
  
The following line is removed: 
``` html
<div class="b">&amp; Frames</div> 
```
And is replaced with: 
``` html 
<div>+ Trumpet</div>
``` 
### Run It! 
----------- 
from your project root:
```
$ cd node_modules/harmon/examples
$ node simple.js
```
Browse to [localhost:8000](http://localhost:8000) and you should see:

![simple output](http://i.imgur.com/Gpbzt.png)

### Code

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
  require('harmon')([], actions),
  9000, 'localhost'
).listen(8000);

// Create a simple web server for the proxy to send requests to and manipulate the data from
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body><div class="a">Nodejitsu Http Proxy</div><div class="b">&amp; Frames</div></body></html>');
  res.end();
}).listen(9000); 
```
or 
See how images could be rotated.
```
$ cd node_modules/harmon/examples
$ node rotate.js
```

See [trumpet](https://github.com/No9/node-trumpet#update) for the types of queries and functions you can 

## License

(The MIT License)

Copyright (c) 2012 Anthony Whalley

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

