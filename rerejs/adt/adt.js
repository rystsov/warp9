define(["rere/adt/maybe", "rere/adt/error", "rere/adt/defaultdict"], function(maybe, error, Defaultdict) {
    return {
        "maybe" : maybe,
        "error" : error,
        "Defaultdict": Defaultdict,
        "dict" : function(items){
        	var dict = {};
        	for (var i=0;i<items.length;i+=2) {
        		dict[items[i]] = items[i+1];
        	}
        	return dict;
        }
    }
});
