expose(MonoidTree);

function MonoidTree(value, size, left, right) {
    this.value = value;
    this.size = size;
    this.left = left;
    this.right = right;
}
MonoidTree.leaf = function(value) {
    return new MonoidTree(value, 1, null, null);
};
MonoidTree.of = function(monoid, left, right) {
    return new MonoidTree(monoid.add(left.value, right.value), left.size + right.size, left, right);
};

MonoidTree.prototype.change = function(monoid, index, value) {
    if (index === 0 && this.size === 1) {
        return MonoidTree.leaf(value);
    }
    if (index < this.left.size) {
        return MonoidTree.of(monoid, this.left.change(monoid, index, value), this.right);
    } else {
        return MonoidTree.of(monoid, this.left, this.right.change(monoid, index - this.left.size, value));
    }
};

MonoidTree.prototype.peek = function() {
    return this.size === 1 ? this.value : this.right.peek();
};

MonoidTree.prototype.put = function(monoid, value) {
    assert (s(this.left)>=s(this.right));
    var left, right;
    if (s(this.left)==s(this.right)) {
        left = this;
        right = MonoidTree.leaf(value);
    } else {
        left = this.left;
        right = this.right.put(monoid, value);
    }
    return MonoidTree.of(monoid, left, right);
};

MonoidTree.prototype.pop = function(monoid) {
    if (this.size==1) return null;
    assert (this.right!=null);
    assert (this.left!=null);
    var right = this.right.pop(monoid);
    if (right==null) {
        return this.left;
    } else {
        return MonoidTree.of(monoid, this.left, right);
    }
};

function s(node) {
    return node==null ? 0 : node.size;
}

function assert(value) {
    if (!value) throw new Error();
}