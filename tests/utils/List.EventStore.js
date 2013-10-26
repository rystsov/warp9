module.exports = ListEventStore;

function ListEventStore(list) {
    this.store = [];
    this.changes = 0;
    if (arguments.length==1) {
        list.onEvent(List.handler(this));
    }
}

ListEventStore.prototype.data = function(data) {
    this.changes++;
    this.store = data.map(function(item){
        return ["add", item];
    });
};

ListEventStore.prototype.add = function(item) {
    this.changes++;
    this.store.push(["add", item]);
};

ListEventStore.prototype.remove = function(key) {
    this.changes++;
    this.store.push(["remove", key]);
};

ListEventStore.prototype.clear = function() {
    this.changes=0;
    this.store = [];
};

ListEventStore.prototype.play = function() {
    var hash = {};
    this.store.forEach(function(e){
        if (e[0]==="add") {
            if (hash.hasOwnProperty(e[1])) throw new Error();
            hash[e[1].key] = e[1].value;
        }
        if (e[0]==="remove") delete hash[e[1]];
    });
    var data = [];
    for (var i in hash) {
        if (!hash.hasOwnProperty(i)) continue;
        data.push(hash[i]);
    }
    data.has = function(value) {
        return this.some(function(x) { return x==value; });
    };
    return data;
};
