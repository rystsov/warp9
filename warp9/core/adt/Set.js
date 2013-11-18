expose(Set);

function Set() {
    this.length = 0;
    this._items = [];
}

Set.prototype.push = function(item) {
    if (this._items.indexOf(item)>=0) return;
    this._items.push(item);
    this.length++;
};

Set.prototype.toList = function() {
    return this._items.map(function(item){ return item; });
};
