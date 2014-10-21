var trumpet = require('trumpet');

module.exports = function harmon(reqselectors, resselectors, htmlonly) {

	var reqselectors = reqselectors || [];
	var resselectors = resselectors || [];

	return function harmon(req, res, next) {
		
		var ignore = false;

		if(htmlonly){
			if((req.url.toLowerCase().indexOf('.js', req.url.length - 3) !== -1) || 
			   (req.url.toLowerCase().indexOf('.css', req.url.length - 4) !== -1)) {
			   	ignore = true;
			}
		}

		if(ignore == false) {
			if (reqselectors.length) {
				var reqtr = trumpet();
				for(var i = 0; i < reqselectors.length; i++){
					reqtr.select(reqselectors[i].query, reqselectors[i].func);
				}
				
				req.on('data', function(data){
					reqtr.write(data);
				});
			}

			if (resselectors.length) {
				var tr = trumpet();
				
				for(var i = 0; i < resselectors.length; i++){
					tr.selectAll(resselectors[i].query, resselectors[i].func);
				}

				var _write = res.write;
				var _end = res.end;
	            var _writeHead = res.writeHead;

				res.write = function (data, encoding) {
					tr.write(data, encoding);
				};

				res.end = function (data, encoding) {
					tr.end(data, encoding);
				};

				tr.on('end', function () {
					_end.call(res);
				});

				tr.on('data', function (buf) {
					_write.call(res, buf);
				});

	            res.writeHead = function (code, headers) {
	            	
	            	//console.log(res.getHeader('content-type'))
	                res.removeHeader('Content-Length');
	                if (headers) { delete headers['content-length']; }
	                _writeHead.apply(res, arguments);
	            };
			}
		}
		next();
	}
}
