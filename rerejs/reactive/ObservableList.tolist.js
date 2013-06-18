define([], function() {
return function(rere) {

//var rv = rere.future("reactive/rv");
var ObservableList = rere.future("reactive/ObservableList");

return {
    rv: {
        list: function(rv) {
            var list = new (ObservableList())([]);
            var keys = {};
            var dispose = function() {};
            rv.onEvent(function(e){
                dispose();
                for (var key in keys) {
                    list.remove(key);
                }
                keys = {};
                dispose = function() {};
                if (e[0]==="set") {
                    dispose = e[1].subscribe((ObservableList()).handler({
                        data: function(e) { 
                            for (var i in e) {
                                keys[e[i].key] = true;
                                list.addKeyValue(e[i].key, e[i].value);
                            }
                        },
                        add: function(e) { 
                            keys[e.key] = true;
                            list.addKeyValue(e.key, e.value);
                        },
                        remove: function(e) { 
                            delete keys[e];
                            list.remove(e);
                        }
                    }));
                }
            });
            return list;
        }
    }
};

};
});