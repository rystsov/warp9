var warp9 = require('../../target/warp9.common');
var List = warp9.core.lists.List;

module.exports = ListEventStore;

function ListEventStore(list) {
    this.changes = 0;
    this.store = [];

    var dispose = list.onChange(List.handler(this));
    this.dispose = function() {
        dispose();
        this.clear();
    };
}

ListEventStore.prototype.reset = function(data) {
    this.changes++;
    this.store = data;
};

ListEventStore.prototype.add = function(item) {
    this.changes++;
    this.store.push(item);
};

ListEventStore.prototype.remove = function(key) {
    this.changes++;

    this.store = this.store.filter(function(item){
        return item.key != key;
    });
};

ListEventStore.prototype.has = function(item) {
    for (var i=0;i<this.store.length;i++) {
        if (this.store[i].value===item) return true;
    }
    return false;
};

ListEventStore.prototype.equalTo = function(values) {
    for (var i=0;i<this.store.length;i++) {
        if (this.store[i].value!==values[i]) return false;
    }
    return true;
};

ListEventStore.prototype.isEmpty = function() {
    return this.store.length==0;
};

ListEventStore.prototype.data = function() {
    return this.store.map(function(item){
        return item.value;
    });
};

ListEventStore.prototype.clear = function() {
    this.changes=0;
    this.store = [];
};