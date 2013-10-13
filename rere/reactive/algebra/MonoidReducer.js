expose(ReduceTree, function(){
    Cell = root.reactive.Cell;
});

var Cell;

function ReduceTree(id, monoid, wrap, ignoreUnset) {
    this.inited = false;
    this.known = {};
    this.id = id;
    this.monoid = monoid;
    this.wrap = wrap;
    this.keyToIndex = {};
    this.indexToKey = [];
    this.ignoreUnset = ignoreUnset;
    this._ignoreSetUnset = false;
}

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

function upsertNode(tree, key, value) {
    value = tree.wrap(value);
    if (tree.keyToIndex.hasOwnProperty(key)) {
        tree.root = tree.root.change(tree.monoid, tree.keyToIndex[key], value);
    } else {
        tree.keyToIndex[key] = s(tree.root);
        tree.indexToKey.push(key);
        tree.root = tree.root==null ? Node.leaf(value) : tree.root.put(tree.monoid, value);
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






function Node(value, size, left, right) {
    this.value = value;
    this.size = size;
    this.left = left;
    this.right = right;
}
Node.leaf = function(value) {
    return new Node(value, 1, null, null);
};
Node.of = function(monoid, left, right) {
    return new Node(monoid.add(left.value, right.value), left.size + right.size, left, right);
};

Node.prototype.change = function(monoid, index, value) {
    if (index === 0 && this.size === 1) {
        return Node.leaf(value);
    }
    if (index < this.left.size) {
        return Node.of(monoid, this.left.change(monoid, index, value), this.right);
    } else {
        return Node.of(monoid, this.left, this.right.change(monoid, index - this.left.size, value));
    }
};

Node.prototype.peek = function() {
    return this.size === 1 ? this.value : this.right.peek();
};

Node.prototype.put = function(monoid, value) {
    assert (s(this.left)>=s(this.right));
    var left, right;
    if (s(this.left)==s(this.right)) {
        left = this;
        right = Node.leaf(value);
    } else {
        left = this.left;
        right = this.right.put(monoid, value);
    }
    return Node.of(monoid, left, right);
};

Node.prototype.pop = function(monoid) {
    if (this.size==1) return null;
    assert (this.right!=null);
    assert (this.left!=null);
    var right = this.right.pop(monoid);
    if (right==null) {
        return this.left;
    } else {
        return Node.of(monoid, this.left, right);
    }
};

function s(node) {
    return node==null ? 0 : node.size;
}

function assert(value) {
    if (!value) throw new Error();
}