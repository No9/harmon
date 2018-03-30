# harmon

A middleware component for [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) using [trumpet](https://github.com/substack/node-trumpet) to parse and transform the response from the proxied server.

[![build status](https://secure.travis-ci.org/No9/harmon.png)](http://travis-ci.org/No9/harmon)

![npmico](https://nodei.co/npm/harmon.png?downloads=true)

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
        var app = connect();

        var proxy = httpProxy.createProxyServer({
              target: 'http://localhost:9000'
        })

        //Additional true parameter can be used to ignore js and css files. 
        //app.use(require('../')([], selects, true));

        app.use(require('../')([], selects));

        app.use(function (req, res) {
                   proxy.web(req, res);
                });

        http.createServer(app).listen(8000);

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

See [trumpet](https://github.com/substack/node-trumpet) for the types of queries and functions you can use.

## Contributors 

[fabiosantoscode](https://github.com/fabiosantoscode)

[no9](https://github.com/no9)

[smazurov](https://github.com/smazurov)

[sergiator](https://github.com/sergiator)

