var trumpet = require('trumpet');

module.exports = function harmon(reqselectors, resselectors) {

	var reqselectors = reqselectors || [];
	var resselectors = resselectors || [];

	return function harmon(req, res, next) {
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

			res.write = function (data) {
				tr.write(data);
			};

			res.end = function (data, encoding) {
				data && tr.end(data, encoding);
				tr.end();
				_end.call(res);
			};

			tr.on('data', function (buf) {
				_write.call(res, buf);
			});
		}

		next();
	}
}
