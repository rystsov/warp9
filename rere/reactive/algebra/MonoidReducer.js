expose(ReduceTree, function(){
    Cell = root.reactive.Cell;
    MonoidTree = root.reactive.algebra.MonoidTree;
    Reducer = root.reactive.algebra.Reducer;
    SetPrototype();
});

var Cell, MonoidTree, Reducer;

function ReduceTree(id, monoid, wrap, ignoreUnset) {
    Reducer.apply(this, [id, wrap, ignoreUnset]);

    this.keyToIndex = {};
    this.indexToKey = [];
    this.monoid = monoid;
}

function SetPrototype() {
    ReduceTree.prototype.set = function(value) {
        throw new Error("Not implemented");
    };

    ReduceTree.prototype.unset = function() {
        throw new Error("Not implemented");
    };

    ReduceTree.prototype.init = function(data) {
        if (this.inited) {
            throw new Error("Can't init object twice, to reset use 'dispose'")
        }
        this.inited = true;
        this._ignoreSetUnset = true;
        this.known = {};
        this.root = null;
        this.blocks = 0;
        if (data) data.forEach(function(item){
            this.add(item.key, item.value);
        }.bind(this));
        this._ignoreSetUnset = false;
        // TODO: call unset
        if (this.blocks===0) {
            set(this);
        }
    };

    ReduceTree.prototype.dispose = function() {
        if (!this.inited) return;
        this._ignoreSetUnset = true;
        for (var key in this.known) {
            if (!this.known.hasOwnProperty(key)) continue;
            this.known[key]();
        }
        this._ignoreSetUnset = false;
        this.inited = false;
        this.known = {};
        if (this.blocks!=0) throw new Error();
    };

    ReduceTree.prototype.remove = function(key) {
        if (!this.inited) {
            throw new Error("ReduceTree is not inited");
        }
        if (!this.known.hasOwnProperty(key)) {
            throw new Error("Trying to delete unknown key: " + key);
        }
        this.known[key]();
        delete this.known[key];
    };

    ReduceTree.prototype.add = function(key, value) {
        if (!this.inited) {
            throw new Error("ReduceTree is not inited");
        }
        if (this.known.hasOwnProperty(key)) {
            throw new Error("Trying to add a already known key: " + key);
        }
        if (typeof value === "object" && value.type === Cell) {
            this.addCell(key, value);
        } else {
            this.addValue(key, value);
        }
    };

    // Internals

    ReduceTree.prototype.addValue = function(key, value) {
        upsertNode(this, key, value);
        tryUpdateValue(this);

        this.known[key] = function() {
            removeNode(this, key);
            tryUpdateValue(this);
        }.bind(this);
    };

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
                        // TODO: double unset
                        isBlocked = true;
                        this.blocks++;
                        unset(this);
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
}

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
        set(tree);
    }
}

function set(tree) {
    if (tree._ignoreSetUnset) return;
    tree.set(tree.root==null ? tree.monoid.identity() : tree.root.value);
}

function unset(tree) {
    if (tree._ignoreSetUnset) return;
    tree.unset();
}

function s(node) {
    return node==null ? 0 : node.size;
}

function assert(value) {
    if (!value) throw new Error();
}