define(
["rere/reactive/ObservableList.Core"], 
function(ObservableListCore) {

var collector = {
    add: function(f) {
        var list = new ObservableListCore([]);
        
        var add = {};
        add.value = function(e) {
            list.add(function(key){
                return e;
            })
        };
        add.rv = function(rv) {
            var lastKey = null;
            rv.onEvent(function(e){
                if (lastKey!=null) {
                    list.remove(lastKey);
                    lastKey = null;
                }
                if (e[0]==="set") {
                    list.add(function(key){
                        lastKey = key;
                        return e[1];
                    });
                }
            });
        };
        add.list = function(item) {
            collector.addList.call(list, item);
        };
        add.rv.maybe = function(rv) {
            var lastKey = null;
            rv.onEvent(function(e){
                if (lastKey!=null) {
                    list.remove(lastKey);
                    lastKey = null;
                }
                if (e[0]==="set") {
                    if (!(e[1]._m_is_maybe)) throw new Error();
                    if (!e[1].isempty()) {
                        list.add(function(key){
                            lastKey = key;
                            return e[1].value();
                        });
                    }
                }
            });
        };
        add.rv.maybe.list = function(rv) {

        };

        f(add);
        return list;
    },
    addList: function(item) {
        var list = this;
        var remap = {}
        item.subscribe(function(e){
            if (e[0]==="data") {
                for (var i in e[1]) {
                    list.add(function(key){
                        remap[e[1][i].key]=key;
                        return e[1][i].value;
                    });
                }
            } else if (e[0]==="add") {
                list.add(function(key){
                    remap[e[1].key]=key;
                    return e[1].value;
                });
            } else if (e[0]==="remove") {
                list.remove(remap[e[1]]);
                delete remap[e[1]];
            } else {
                throw new Error("Unknown event: " + e[0]);
            }
        });
    }
};

return collector;

});