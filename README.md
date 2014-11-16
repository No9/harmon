#harmon-binary

A fork of [harmon](https://github.com/No9/harmon) that works with proxies that must handle both HTML and binary content in responses.

This fork also gives trumpet callbacks the ability to access both the request and response.

##install

```
$ npm install harmon-binary
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
$ cd node_modules/harmon-binary/examples
$ node simple.js
```
Browse to [localhost:8000](http://localhost:8000) and you should see:

![simple output](http://i.imgur.com/Gpbzt.png)

### Code

``` js

var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    harmonBin = require('harmon-binary');


    var selects = [];
    var simpleselect = {};

        simpleselect.query = '.b';
        simpleselect.func = function (node, req, res) {
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

        /* The first parameter makes it possible to use trumpet on the
         * incoming request body (this tends to be rare).
         *
         * The second parameter applies trumpet to the response body,
         * which tends to be the desired target.
         */
        app.use(harmonBin([], selects));

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
$ cd node_modules/harmon-binary/examples
$ node rotate.js
```

See [trumpet](https://github.com/substack/node-trumpet) for the types of queries and functions you can use.

## Contributors 

[fabiosantoscode](https://github.com/fabiosantoscode)

[no9](https://github.com/no9)

[smazurov](https://github.com/smazurov)

[GuyPaddock](https://github.com/GuyPaddock)

