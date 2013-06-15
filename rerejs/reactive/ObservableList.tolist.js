define(
["rere/reactive/rv", "rere/reactive/ObservableList.Core"], 
function(rv, ObservableListCore) {

var tolist = {
    rv: {
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
                    dispose = e[1].subscribe(ObservableListCore.handler({
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
return tolist;

});