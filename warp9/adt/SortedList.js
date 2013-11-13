expose(SortedList);

// TODO: rewrite to SortedSet
function SortedList(comparator) {
    // TODO: implement http://en.wikipedia.org/wiki/Treap
    this.length = 0;
    this.comparator = comparator;
    this._items = [];
}

SortedList.prototype.push = function(item) {
    this._items.push(item);
    this.length++;
};

SortedList.prototype.pop = function(item) {
    if (this.length==0) {
        throw new Error();
    }
    this._items = this._items.sort(this.comparator);
    this.length--;
    return this._items.shift();
};
