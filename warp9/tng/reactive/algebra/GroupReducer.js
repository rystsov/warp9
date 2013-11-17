expose(GroupReducer, function() {
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
});

var None, Some;

function GroupReducer(monoid, wrap, ignoreUnset) {
    this.monoid = monoid;
    this.wrap = wrap;
    this.ignoreUnset = ignoreUnset;

    this.sum = monoid.identity();
    this.value = new Some(this.sum);

    this.info = {};
    this.blocks = 0;
}

GroupReducer.prototype.add = function(key, value) {
    if (this.info.hasOwnProperty(key)) {
        throw new Error();
    }
    var info = {
        blocked: value.isEmpty(),
        last: value.isEmpty() ? this.monoid.identity() : this.wrap(value.value())
    };
    this.info[key] = info;
    this.sum = this.monoid.add(this.sum, info.last);

    if (info.blocked) {
        this.blocks++;
    }

    if (this.blocks==0 || this.ignoreUnset) {
        this.value = new Some(this.sum);
    } else if (this.blocks==1) {
        this.value = new None();
    }
};

GroupReducer.prototype.update = function(key, value) {
    this.remove(key);
    this.add(key, value);
};

GroupReducer.prototype.remove = function(key) {
    if (!this.info.hasOwnProperty(key)) {
        throw new Error();
    }
    var info = this.info[key];
    delete this.info[key];

    this.sum = this.monoid.add(this.sum, this.monoid.invert(info.last));

    if (info.blocked) {
        this.blocks--;
    }

    if (this.blocks==0 || this.ignoreUnset) {
        this.value = new Some(this.sum);
    }
};