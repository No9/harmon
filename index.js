var trumpet = require('trumpet');
var zlib = require('zlib');

module.exports = function harmonBinary(reqSelectors, resSelectors, htmlOnly) {
  var _reqSelectors = reqSelectors || [];
  var _resSelectors = resSelectors || [];
  var _htmlOnly     = (typeof htmlOnly == 'undefined') ? false : htmlOnly;

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
    var gunzip      = zlib.Gunzip();

    prepareSelectors(tr, _resSelectors, req, res);

    res.isHtml = function () {
      if (res._isHtml === undefined) {
        var contentType = res.getHeader('content-type') || '';
        res._isHtml = contentType.startsWith('text/html');
      }

      return res._isHtml;
    }

    res.isGzipped = function () {
      if (res._isGzipped === undefined) {
        var encoding = res.getHeader('content-encoding') || '';
        res._isGzipped = encoding.toLowerCase() === 'gzip' && res.isHtml();
      }

      return res._isGzipped;
    }

    res.writeHead = function () {
      var headers = (arguments.length > 2) ? arguments[2] : arguments[1]; // writeHead supports (statusCode, headers) as well as (statusCode, statusMessage, headers)
      headers = headers || {};

      /* Sniff out the content-type header.
       * If the response is HTML, we're safe to modify it.
       */
      if (!_htmlOnly && res.isHtml()) {
        res.removeHeader('Content-Length');
        delete headers['content-length'];
      }

      /* Sniff out the content-encoding header.
       * If the response is Gziped, we're have to gunzip content before and ungzip content after.
       */
      if (res.isGzipped()) {
        res.removeHeader('Content-Encoding');
        delete headers['content-encoding'];
      }

      _writeHead.apply(res, arguments);
    };

    res.write = function (data, encoding) {
      // Only run data through trumpet if we have HTML
      if (res.isHtml()) {
        if (res.isGzipped()) {
          gunzip.write(data);
        } else {
          tr.write(data, encoding);
        }
      } else {
        _write.apply(res, arguments);
      }
    };

    tr.on('data', function (buf) {
      _write.call(res, buf);
    });

    gunzip.on('data', function (buf) {
      tr.write(buf);
    });

    res.end = function (data, encoding) {
      if (res.isGzipped()) {
        gunzip.end(data);
      } else {
        tr.end(data, encoding);
      }
    };

    gunzip.on('end', function (data) {
      tr.end(data);
    });

    tr.on('end', function () {
      _end.call(res);
    });
  }

  function prepareSelectors(tr, selectors, req, res) {
    for (var i = 0; i < selectors.length; i++) {
      (function (callback, req, res) {
        var callbackInvoker  = function(element) {
          callback(element, req, res);
        };

        tr.selectAll(selectors[i].query, callbackInvoker);
      })(selectors[i].func, req, res);
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
