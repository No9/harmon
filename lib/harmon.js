var trumpet = require('trumpet');


exports = module.exports = function harmon(selects) {
    
    var tr = trumpet();
    var selects = selects || [];

    for(var i = 0; i < selects.length; i++){
        console.log(selects[i].query);
        tr.select(selects[i].query, selects[i].func);
    }

    return function harmon(req, res, next)
    {
        var _write = res.write;
        
        res.write = function (data) {
            tr.write(data);
        }
        
        tr.on('data', function (buf) { 
            _write.call(res, buf);
        });        

        next();
    }
}