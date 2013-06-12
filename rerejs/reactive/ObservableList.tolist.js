define(
["rere/reactive/rv", "rere/reactive/ObservableList.Core"], 
function(rv, ObservableListCore) {

var tolist = {
    rv: {
        maybe: {
            list: function(val) {
                return tolist.rv.list(rv.maybe.unwrap(val));
            }
        },
        list: function(rv) {
            var list = new ObservableListCore([]);
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
                    dispose = e[1].subscribe(function(e){
                        if (e[0]==="data") {
                            for (var i in e[1]) {
                                keys[e[1][i].key] = true;
                                list.addKeyValue(e[1][i].key, e[1][i].value);
                            }
                        } else if (e[0]==="add") {
                            keys[e[1].key] = true;
                            list.addKeyValue(e[1].key, e[1].value);
                        } else if (e[0]==="remove") {
                            delete keys[e[1]]
                            list.remove(e[1]);
                        } else {
                            throw new Error("Unknown event: " + e[0]);
                        }
                    });
                }
            });
            return list;
        }
    }
};
return tolist;

});