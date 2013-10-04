expose(ReduceTree, function(){
    Cell = root.reactive.Cell;
});

var Cell;

function ReduceTree(monoid, wrap, unwrap, ignoreUnset) {
    this.monoid = monoid;
    this.root = null;
    this.value = new Cell(unwrap(monoid.identity()));
    this.index = {};
    this.blocks = 0;
    this.keyId = 0;

    this.tryUpdateValue = function() {
        if (this.blocks === 0) {
            this.value.set(unwrap(this.root==null ? monoid.identity() : this.root.value));
        }
    };

    this.upsert = function(key, value) {
        value = wrap(value);
        if (this.index.hasOwnProperty(key)) {
            this.root = this.root.change(this.monoid, this.index[key], value);
        } else {
            this.index[key] = s(this.root);
            this.root = this.root==null ? Node.leaf(value) : this.root.put(monoid, value);
        }
        this.tryUpdateValue();
    };

    this.delete = function(key) {
        if (!this.index.hasOwnProperty(key)) return;
        if (this.index[key]+1 !== s(this.root)) {
            this.root = this.root.change(this.monoid, this.index[key], this.root.peek());
        }
        this.root = this.root.pop(monoid);
        delete this.index[key];
        this.tryUpdateValue();
    };

    this.add = function(value) {
        var key = this.keyId++;
        if (typeof value === "object" && value.type === Cell) {
            var isBlocked = false;
            var unblock = function() {
                if (isBlocked) {
                    isBlocked = false;
                    this.blocks--;
                }
            }.bind(this);
            var unsubscribe = value.onEvent([this.value], Cell.handler({
                "set": function(value) {
                    unblock();
                    this.upsert(key, value);
                }.bind(this),
                "unset": function() {
                    if (ignoreUnset) {
                        this.delete(key);
                    } else if (!isBlocked) {
                        isBlocked = true;
                        this.blocks++;
                        this.value.unset();
                    }
                }.bind(this)
            }));
            return function(){
                unsubscribe();
                unblock();
                this.delete(key);
            }.bind(this);
        } else {
            this.upsert(key, value);
            return function() {
                this.delete(key);
            }.bind(this);
        }
    }
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