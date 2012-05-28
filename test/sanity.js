var test = require('tap').test;

test('Environment Sanity Check', function(t){
	var is = true;
	var shouldbe = true;
	t.equal(is, shouldbe);
	t.end();
});