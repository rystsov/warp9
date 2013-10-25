expose(ReduceTree, function(){
    Cell = root.reactive.Cell;
    MonoidTree = root.reactive.algebra.MonoidTree;
});

var Cell, MonoidTree, Reducer;

function ReduceTree(id, monoid, wrap, ignoreUnset, callback) {
    this.id = id;
    this.wrap = wrap;
    this.ignoreUnset = ignoreUnset;
    this.monoid = monoid;
    this.callback = callback;

    this.root = null;
    this.keyToIndex = {};
    this.indexToKey = [];
    this.isActive = true;
    this.known = {};
    this.inited = false;
    this.blocks = 0;
    this.reports = 0;
    this.count = 0;
}

ReduceTree.prototype.init = function(data) {
    if (this.inited) throw new Error();
    this.inited = true;
    this.count = data.length;
    data.forEach(function(item){
        this._add(item.key, item.value);
    }.bind(this));
    if (data.length==0) {
        this.callback(["set", this.monoid.identity()]);
    }
};

ReduceTree.prototype.add = function(key, value) {
    this.count++;
    this._add(key, value);
};

ReduceTree.prototype._add = function(key, value) {
    var self = this;

    if (!(typeof value === "object" && value.type === Cell)) {
        value = new Cell(value);
    }
    var isActive = true;
    var isBlocked = false;
    var isReported = false;
    //var last = null;

    value.use(self.id);
    var dispose = value.onEvent(function(e) {
        if (!isActive || !self.isActive) return;
        if (!isReported) {
            self.reports++;
            isReported = true;
        }
        if (e[0] === "set") {
            set(e[1]);
        } else if (e[0] === "unset") {
            unset();
        } else {
            throw new Error();
        }
    });

    self.known[key] = function() {
        if (!isActive) return;
        removeNode(self, key);
        isActive = false;
        dispose();
        value.leave(self.id);
        if (isBlocked) {
            isBlocked = false;
            self.blocks--;
        }
        self.count--;
        self.reports--;
    };

    function set(x) {
        if (isBlocked) {
            isBlocked = false;
            self.blocks--;
        }
        upsertNode(self, key, self.wrap(x));
        self.raise();
    }

    function unset() {
        if (isBlocked) return;
        isBlocked = true;
        self.blocks++;
        upsertNode(self, key, self.monoid.identity());
        if (self.blocks==1) {
            self.raise();
        }
    }
};

ReduceTree.prototype.raise = function() {
    if (this.count != this.reports) return;
    if (!this.ignoreUnset && this.blocks>0) {
        this.callback(["unset"]);
        return;
    }
    this.callback(["set", this.root == null ? this.monoid.identity() : this.root.value]);
};

ReduceTree.prototype.remove = function(key) {
    if (!this.known.hasOwnProperty(key)) {
        throw new Error("Unknown key: " + key);
    }
    this.known[key]();
    delete this.known[key];
    this.raise();
};

ReduceTree.prototype.dispose = function() {
    this.isActive = false;
    var keys = [];
    for (var key in this.known) {
        if (!this.known.hasOwnProperty(key)) continue;
        this.known[key]();
        keys.push(key);
    }
    keys.forEach(function(key) { delete this.known[key] }.bind(this));
};




function upsertNode(tree, key, value) {
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

function s(node) {
    return node==null ? 0 : node.size;
}

function assert(value) {
    if (!value) throw new Error();
}
