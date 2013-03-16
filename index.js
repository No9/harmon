var trumpet = require('trumpet');

module.exports = function harmon(reqselectors, resselectors) {

	var reqselectors = reqselectors || [];
	var resselectors = resselectors || [];

	return function harmon(req, res, next)
	{
		var _write = res.write;
		var reqtr = trumpet();
		for(var i = 0; i < reqselectors.length; i++){
			reqtr.select(reqselectors[i].query, reqselectors[i].func);
		}
		
		req.on('data', function(data){
			reqtr.write(data);
		});
		
    	res.write = function (data) {
			var tr = trumpet();
			
			
			for(var i = 0; i < resselectors.length; i++){
				tr.select(resselectors[i].query, resselectors[i].func);
			}
			tr.on('data', function (buf) { 
				_write.call(res, buf);
			});
				
			tr.write(data);
    	}
		next();
	}
}