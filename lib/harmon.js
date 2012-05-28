var trumpet = require('trumpet');

exports = module.exports = function harmon(selects) {

	var selects = selects || [];

	return function harmon(req, res, next)
	{
		var _write = res.write;
    
    	res.write = function (data) {
        	var tr = trumpet();
            
            for(var i = 0; i < selects.length; i++)
            {
            	tr.select(selects[i].query, selects[i].func);
            }
            
            tr.on('data', function (buf) { 
              _write.call(res, buf);
            });
            
            tr.write(data);
    	}
		next();
	}
}