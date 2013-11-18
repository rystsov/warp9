expose(MonoidReducer, function() {
    None = root.core.adt.maybe.None;
    Some = root.core.adt.maybe.Some;
    MonoidTree = root.core.algebra.MonoidTree;
});

var None, Some, MonoidTree;

function MonoidReducer(monoid, wrap, ignoreUnset) {
    this.monoid = monoid;
    this.wrap = wrap;
    this.ignoreUnset = ignoreUnset;

    this.value = new Some(monoid.identity());

    this.root = null;
    this.keyToIndex = {};
    this.indexToKey = [];

    this.info = {};
    this.blocks = 0;
}

MonoidReducer.prototype.add = function(key, value) {
    if (this.info.hasOwnProperty(key)) {
        throw new Error();
    }
    var info = {
        blocked: value.isEmpty()
    };
    if (info.blocked) {
        this.blocks++;
    }
    this.info[key] = info;

    value = value.isEmpty() ? this.monoid.identity() : this.wrap(value.get());

    this.keyToIndex[key] = MonoidTree.size(this.root);
    this.indexToKey.push(key);
    this.root = this.root==null ? MonoidTree.leaf(value) : this.root.put(this.monoid, value);
    assert(MonoidTree.size(this.root) == this.indexToKey.length);

    if (this.blocks==0 || this.ignoreUnset) {
        this.value = new Some(this.root.value);
    } else if (this.blocks==1) {
        this.value = new None();
    }
};

MonoidReducer.prototype.update = function(key, value) {
    this.remove(key);
    this.add(key, value);
};

MonoidReducer.prototype.remove = function(key) {
    if (!this.keyToIndex.hasOwnProperty(key)) {
        throw new Error("Unknown key: " + key);
    }
    // the element being deleted is not the last
    if (this.keyToIndex[key]+1 !== this.indexToKey.length) {
        this.root = this.root.change(this.monoid, this.keyToIndex[key], this.root.peek());
        var lastKey = this.indexToKey.pop();
        this.indexToKey[this.keyToIndex[key]] = lastKey;
        this.keyToIndex[lastKey] = this.keyToIndex[key];
    } else {
        this.indexToKey.pop();
    }
    this.root = this.root.pop(this.monoid);
    delete this.keyToIndex[key];

    if (!this.info.hasOwnProperty(key)) {
        throw new Error();
    }
    if (this.info[key].blocked) {
        this.blocks--;
    }
    delete this.info[key];
    if (this.blocks==0 || this.ignoreUnset) {
        if (this.root == null) {
            this.value = new Some(this.monoid.identity());
        } else {
            this.value = new Some(this.root.value);
        }
    }
};

function assert(value) {
    if (!value) throw new Error();
}