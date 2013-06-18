define(
["rere/adt/adt", "rere/reactive/reactive"], 
function(adt, reactive) {

var rere = {}
rere.future = function(path) {
	var parts = path.split("/")
	return function() {
		var obj = rere;
		for (var i=0;i<parts.length;i++) {
			obj = obj[parts[i]];
		}
		return obj;
	}
};
rere.adt = adt(rere);
rere.reactive = reactive(rere);
return rere;

});
