var trumpet = require('trumpet');


exports = module.exports = function harmon(selects) {
    
    
    var selects = selects || [];

    

    return function harmon(req, res, next)
    {
        //funnily enough having this at module scope really effects the amount of resources required
        var tr = trumpet();
	for(var i = 0; i < selects.length; i++){
		tr.select(selects[i].query, selects[i].func);
	    }

        //These docs are ignores as they sometimes have < and so hang trumpet
        if(req.url.indexOf('.js') != (req.url.length - 3)){
           if(req.url.indexOf('.css') != (req.url.length - 4)){
            if(res._hasBody){
                var _write = res.write;
                res.write = function (data) {
                tr.write(data);
               }
            }
            
            tr.on('data', function (buf) {
                //console.log('data buffing')
                if(buf != undefined){
                    _write.call(res, buf);
                }
            });        
            }
        }
        next();
    }
}
