expose(Sigma, function() {
    Cell = root.reactive.Cell;
    Reducer = root.reactive.algebra.Reducer;
});

var Cell, Reducer;

function Sigma(id, group, wrap, ignoreUnset) {
    Reducer.apply(this, [id, wrap, ignoreUnset]);

    this.group = group;
}

Sigma.prototype.addCell = function(key, value) {
    var last = null;
    var isBlocked = false;
    value.use(this.id);
    var unsubscribe = value.onEvent(Cell.handler({
        set: function(value) {
            if (isBlocked) {
                this.blocks--;
                isBlocked = false;
            }
            if (last!=null) {
                this.sum = this.group.add(this.sum, this.group.invert(last.value));
            }
            last = { value: this.wrap(value) };
            this.sum = this.group.add(this.sum, last.value);
            if (this.ignoreUnset || this.blocks==0) {
                this._set();
            }
        }.bind(this),
        unset: function() {
            if (this.ignoreUnset) {
                if (last==null) return;
                this.sum = this.group.add(this.sum, this.group.invert(last.value));
                last = null;
                this._set();
            } else {
                if (!isBlocked) {
                    isBlocked = true;
                    this.blocks++;
                    // TODO: double unset
                    this._unset();
                }
            }
        }.bind(this)
    }));

    this.known[key] = function() {
        unsubscribe();
        value.leave(this.id);
        if (last!=null) {
            this.sum = this.group.add(this.sum, this.group.invert(last.value));
        }
        if (isBlocked) {
            this.blocks--;
        }
        if (this.blocks==0) {
            this._set();
        }
    }.bind(this);
};

Sigma.prototype.addValue = function(key, value) {
    value = this.wrap(value);
    this.sum = this.group.add(this.sum, value);
    if (this.blocks===0) {
        this._set();
    }
    this.known[key] = function(){
        this.sum = this.group.add(this.sum, this.group.invert(value));
        if (this.blocks===0) {
            this._set();
        }
    }.bind(this);
};


Sigma.prototype._set = function() {
    if (this._ignoreSetUnset) return;
    this.set(this.sum);
};

Sigma.prototype._unset = function() {
    if (this._ignoreSetUnset) return;
    this.unset();
};

Sigma.prototype._setIdentity = function() {
    this.sum = this.group.identity();
};