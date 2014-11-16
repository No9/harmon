var trumpet = require('trumpet');

module.exports = function harmonBinary(reqSelectors, resSelectors, htmlOnly) {
  var _reqSelectors = reqSelectors || [];
  var _resSelectors = resSelectors || [];
  var _htmlOnly     = htmlOnly || false;

  function prepareRequestSelectors(req, res) {
    var tr = trumpet();
  
    prepareSelectors(tr, _reqSelectors, req, res);
    
    req.on('data', function(data) {
      tr.write(data);
    });
  }
    
  function prepareResponseSelectors(req, res) {
    var tr          = trumpet();
    var _write      = res.write;
    var _end        = res.end;
    var _writeHead  = res.writeHead;

    prepareSelectors(tr, _resSelectors, req, res);

    // Assume response is binary by default
    res.isHtml = false;
    
    res.writeHead = function (code, headers) {
      var contentType = this.getHeader('content-type');
      
      /* Sniff out the content-type header.
       * If the response is HTML, we're safe to modify it.
       */
      if (!_htmlOnly || ((typeof contentType != 'undefined') && (contentType.indexOf('text/html') == 0))) {
        res.isHtml = true;

        // Strip off the content length since it will change.
        res.removeHeader('Content-Length');

        if (headers) {
          delete headers['content-length'];
        }
      }
      
      _writeHead.apply(res, arguments);
    };
    
    res.write = function (data, encoding) {
      // Only run data through trumpet if we have HTML
      if (res.isHtml) {
        tr.write(data, encoding);
      }
      
      else {
        _write.apply(res, arguments);
      }
    };

    tr.on('data', function (buf) {
      _write.call(res, buf);
    });

    res.end = function (data, encoding) {
      tr.end(data, encoding);
    };

    tr.on('end', function () {
      _end.call(res);
    });
  }

  function prepareSelectors(tr, selectors, req, res) {
    for (var i = 0; i < selectors.length; i++) {
      var callback         = selectors[i].func;
      var callbackInvoker  = function(element) {
        callback(element, req, res);
      }; 
      
      tr.selectAll(selectors[i].query, callbackInvoker);
    }
  }
    
  return function harmonBinary(req, res, next) {
    var ignore = false;

    if (_htmlOnly) {
      var lowercaseUrl = req.url.toLowerCase();

      if ((lowercaseUrl.indexOf('.js', req.url.length - 3) !== -1) ||
          (lowercaseUrl.indexOf('.css', req.url.length - 4) !== -1)) {
        ignore = true;
      }
    }

    if (!ignore) {
      if (_reqSelectors.length) {
        prepareRequestSelectors(req, res);
      }

      if (_resSelectors.length) {
        prepareResponseSelectors(req, res);
      }
    }

    next();
  };
};
