trumpet
=======

Parse and transform streaming html using css selectors.

[![build status](https://secure.travis-ci.org/substack/node-trumpet.png)](http://travis-ci.org/substack/node-trumpet)

![trumpet](http://substack.net/images/trumpet.png)

example
=======

select
------

``` js
var trumpet = require('trumpet');
var tr = trumpet();

tr.select('.b span', function (node) {
    node.html(function (html) {
        console.log(node.name + ': ' + html);
    });
});

var fs = require('fs');
fs.createReadStream(__dirname + '/select.html').pipe(tr);
```

``` html
<html>
  <head>
    <title>beep</title>
  </head>
  <body>
    <div class="a">¡¡¡</div>
    <div class="b">
      <span>tacos</span>
      <span>y</span>
      <span>burritos</span>
    </div>
    <div class="a">!!!</div>
  </body>
</html>
```

output:

```
$ node example/select.js 
span: tacos
span: y
span: burritos
```

update
------

``` js
var trumpet = require('trumpet');
var tr = trumpet();
 
tr.update('.b span', function (html, node) {
    return html.toUpperCase();
});

tr.update('.c', '---');
tr.remove('.d');
tr.remove('.e');

var fs = require('fs');
tr.pipe(process.stdout, { end : false });
fs.createReadStream(__dirname + '/update.html').pipe(tr);
```

``` html
<html>
  <head>
    <title>beep</title>
  </head>
  <body>
    <div class="a">¡¡¡</div>
    <div class="b">
      <span>tacos</span>
      <span>y</span>
      <span>burritos</span>
    </div>
    <div class="a">!!!</div>
    
    <div class="c">
        <span>beep</span>
        <span>boop</span>
    </div>
    
    <div class="d">
        <span>x</span>
        <span>y</span>
    </div>
  </body>
</html>
```

output:

```
$ node example/update.js
<html>
  <head>
    <title>beep</title>
  </head>
  <body>
    <div class="a">¡¡¡</div>
    <div class="b">
      <span>TACOS</span>
      <span>Y</span>
      <span>BURRITOS</span>
    </div>
    <div class="a">!!!</div>
    
    <div class="c">---</div>
    
    
  </body>
</html>
```

methods
=======

var trumpet = require('trumpet')

var tr = trumpet(opts)
----------------------

Create a new trumpet stream. This stream is readable and writable.
Pipe an html stream into `tr` and get back a transformed html stream.

Parse errors are emitted by `tr` in an `'error'` event.

By default, trumpet uses this list of
[self-closing tags](http://stackoverflow.com/questions/97522/what-are-all-the-valid-self-closing-tags-in-xhtml-as-implemented-by-the-major-b):

``` js
[ 'area', 'base', 'basefont', 'br', 'col', 'hr', 'input', 'img', 'link', 'meta' ]
```

You can specify a custom list by setting `opts.special`.

tr.select(selector, fn)
-----------------------

Fire `fn(node)` for every element in the html stream that matches the css
`selector`.

The nodes are described in the nodes section of this document.

tr.update(selector, fn)
-----------------------

Calls `node.update(fn)` on the nodes that match the `selector`
except that `fn` gets the `node` as a second argument.

To update attributes you'll need to use the long-form of calling `tr.select()`
then `node.update(fn, attrs)` inside the callback.

tr.replace(selector, fn)
------------------------

Calls `node.replace(fn)` on the nodes that match the `selector`
except that `fn` gets the `node` as a second argument.

tr.remove(selector, fn)
-----------------------

Calls `node.remove()` on nodes that match the `selector`.

If `fn` is provided, it will be called after an element is removed.

nodes
=====

node.name
---------

The name of the html element node, such as `'div'` or `'span'`.

node.attributes
---------------

An object with all the html attributes.

For example,

``` html
<img src="/beep.png" width="32" height="32">
```

has an attribute object of:

``` js
{ src : 'beep.png', width : '32', height : '32' }
```

node.html(cb)
-------------

Get the inner text and html for the element, which may not have arrived yet.

`cb(text)` fires when the inner contents are ready.

node.update(cb, attr), node.update(html, attr)
----------------------------------------------

Replace the node's inner contents with the string `html` or the string return
value from `cb(html)`.

If `attr` is specified, these will be used in the output stream as the new tag
attributes instead of `node.attributes`.

node.replace(cb), node.replace(html)
------------------------------------

Replace the node's outer content with the string `html` or the return value from
`cb(html)`. The `html` passed to `cb` will be the outer contents.

node.remove()
-------------

Remove a node from the output stream.

selector syntax
===============

Presently these [css selectors](http://www.w3.org/TR/CSS2/selector.html) work:

* *
* E
* E F
* E > F
* E + F
* E.class
* E#id

install
=======

With [npm](http://npmjs.org) do:

```
npm install trumpet
```

license
=======

MIT/X11
