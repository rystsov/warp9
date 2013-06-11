define(
["rere/reactive/ObservableList.Core"], 
function(ObservableListCore) {

return function(f) {
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
};

});