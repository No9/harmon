#harmon

A middleware component for [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) using [trumpet](https://github.com/substack/node-trumpet) to parse and transform the response from the proxied server.

[![build status](https://secure.travis-ci.org/No9/harmon.png)](http://travis-ci.org/No9/harmon)

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
    connect = require('connect'),
    httpProxy = require('http-proxy');


var selects = [];
var simpleselect = {};

simpleselect.query = '.b';
simpleselect.func = function (node) {
    node.createWriteStream().end('<div>+ Trumpet</div>');
}

selects.push(simpleselect);

//
// Basic Connect App
//
connect.createServer(
  require('harmon')([], selects),
  function (req, res) {
    proxy.web(req, res);
  }
).listen(8000);

var proxy = httpProxy.createProxyServer({
   target: 'http://localhost:9000'
})

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

See [trumpet](https://github.com/No9/node-trumpet#update) for the types of queries and functions you can use.

## Contributors 

[fabiosantoscode](https://github.com/fabiosantoscode)

[no9](https://github.com/no9)


