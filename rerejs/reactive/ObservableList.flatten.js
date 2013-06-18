define([], function() {
return function(rere) {

var ObservableList = rere.future("reactive/ObservableList");

return function() {
    var result = new (ObservableList())([]);
    var groups = {};
    this.subscribe((ObservableList()).handler({
        data: function(items) {
            for (var i in items) {
                this.add(items[i]);
            }
        },
        add: function(item) {
            groups[item.key] = new Object();
            var sublist = item.value, group = groups[item.key];
            group.remap = {};
            group.dispose = sublist.subscribe((ObservableList()).handler({
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
};

};
});