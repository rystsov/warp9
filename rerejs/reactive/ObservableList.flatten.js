define(
["rere/reactive/ObservableList.Core"], 
function(ObservableListCore) {

return function() {
    var result = new ObservableListCore([]);
    var groups = {};
    this.subscribe(handler({
        data: function(items) {
            for (var i in items) {
                this.add(items[i]);
            }
        },
        add: function(item) {
            groups[item.key] = new Object();
            var sublist = item.value, group = groups[item.key];
            group.remap = {};
            group.dispose = sublist.subscribe(handler({
                data: function(items) {
                    for (var i in items) {
                        this.add(items[i]);
                    }
                },
                add: function(item) {
                    group.remap[item.key] = result.addValue(item.value);
                },
                remove: function(key) {
                    result.remove(group.remap[key]);
                    delete group.remap[key];
                },
            }));
        },
        remove: function(key) {
            groups[key].dispose();
            for (var old in groups[key].remap) {
                result.remove(groups[key].remap[old]);
            }
        }
    }));
    return result;
}

function handler(handlers) {
    return function(e) {
        while(true) {
            if (e[0]==="data") break;
            if (e[0]==="add") break;
            if (e[0]==="remove") break;
            throw new Error();
        }
        handlers[e[0]].call(handlers, e[1]);
    }
}

});