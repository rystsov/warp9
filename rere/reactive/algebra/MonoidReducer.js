expose(ReduceTree, function(){
    Cell = root.reactive.Cell;
    MonoidTree = root.reactive.algebra.MonoidTree;
    Reducer = root.reactive.algebra.Reducer;
});

var Cell, MonoidTree, Reducer;

function ReduceTree(id, monoid, wrap, ignoreUnset) {
    Reducer.apply(this, [id, wrap, ignoreUnset]);

    this.keyToIndex = {};
    this.indexToKey = [];
    this.monoid = monoid;
}

ReduceTree.prototype.addCell = function(key, value) {
    var isBlocked = false;
    value.use(this.id);
    var unsubscribe = value.onEvent(Cell.handler({
        set: function(value) {
            if (isBlocked) {
                this.blocks--;
                isBlocked = false;
            }
            upsertNode(this, key, value);
            tryUpdateValue(this);
        }.bind(this),
        unset: function() {
            if (this.ignoreUnset) {
                upsertNode(this, key, this.monoid.identity());
                tryUpdateValue(this);
            } else {
                if (!isBlocked) {
                    isBlocked = true;
                    this.blocks++;
                    if (this.blocks===1) {
                        this._unset();
                    }
                }
            }
        }.bind(this)
    }));

    this.known[key] = function() {
        unsubscribe();
        value.leave(this.id);
        removeNode(this, key);
        if (isBlocked) {
            this.blocks--;
        }
        tryUpdateValue(this);
    }.bind(this);
};

ReduceTree.prototype.addValue = function(key, value) {
    upsertNode(this, key, value);
    tryUpdateValue(this);

    this.known[key] = function() {
        removeNode(this, key);
        tryUpdateValue(this);
    }.bind(this);
};


ReduceTree.prototype._set = function() {
    if (this._ignoreSetUnset) return;
    this.set(this.root==null ? this.monoid.identity() : this.root.value);
};

ReduceTree.prototype._unset = function() {
    if (this._ignoreSetUnset) return;
    this.unset();
};

ReduceTree.prototype._setIdentity = function() {
    this.root = null;
};


function upsertNode(tree, key, value) {
    value = tree.wrap(value);
    if (tree.keyToIndex.hasOwnProperty(key)) {
        tree.root = tree.root.change(tree.monoid, tree.keyToIndex[key], value);
    } else {
        tree.keyToIndex[key] = s(tree.root);
        tree.indexToKey.push(key);
        tree.root = tree.root==null ? MonoidTree.leaf(value) : tree.root.put(tree.monoid, value);
        assert(s(tree.root) == tree.indexToKey.length);
    }
}

function removeNode(tree, key) {
    if (!tree.keyToIndex.hasOwnProperty(key)) return;
    if (tree.keyToIndex[key]+1 !== tree.indexToKey.length) {
        tree.root = tree.root.change(tree.monoid, tree.keyToIndex[key], tree.root.peek());
        var lastKey = tree.indexToKey.pop();
        tree.indexToKey[tree.keyToIndex[key]] = lastKey;
        tree.keyToIndex[lastKey] = tree.keyToIndex[key];
    } else {
        tree.indexToKey.pop();
    }
    tree.root = tree.root.pop(tree.monoid);
    delete tree.keyToIndex[key];
}

function tryUpdateValue(tree) {
    if (tree.ignoreUnset || tree.blocks === 0) {
        tree._set();
    }
}

function s(node) {
    return node==null ? 0 : node.size;
}

function assert(value) {
    if (!value) throw new Error();
}