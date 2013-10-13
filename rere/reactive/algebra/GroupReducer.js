expose(Sigma, function() {
    Cell = root.reactive.Cell;
});

var Cell;

function Sigma(id, group, wrap, ignoreUnset) {
    this.id = id;
    this.group = group;
    this.wrap = wrap;
    this.inited = false;
    this.ignoreUnset = ignoreUnset;
    this._ignoreSetUnset = false;
}

Sigma.prototype.set = function(value) {
    throw new Error("Not implemented");
};

Sigma.prototype.unset = function() {
    throw new Error("Not implemented");
};

Sigma.prototype.init = function(data) {
    if (this.inited) {
        throw new Error("Can't init object twice, to reset use 'dispose'")
    }
    this.inited = true;
    this._ignoreSetUnset = true;
    this.known = {};
    this.sum = this.group.identity();
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

Sigma.prototype.dispose = function() {
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

Sigma.prototype.remove = function(key) {
    if (!this.inited) {
        throw new Error("Sigma is not inited");
    }
    if (!this.known.hasOwnProperty(key)) {
        throw new Error("Trying to delete unknown key: " + key);
    }
    this.known[key]();
    delete this.known[key];
};

Sigma.prototype.add = function(key, value) {
    if (!this.inited) {
        throw new Error("Sigma is not inited");
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
                set(this);
            }
        }.bind(this),
        unset: function() {
            if (this.ignoreUnset) {
                if (last==null) return;
                this.sum = this.group.add(this.sum, this.group.invert(last.value));
                last = null;
                set(this);
            } else {
                if (!isBlocked) {
                    isBlocked = true;
                    this.blocks++;
                    // TODO: double unset
                    unset(this);
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
            set(this);
        }
    }.bind(this);
};

Sigma.prototype.addValue = function(key, value) {
    value = this.wrap(value);
    this.sum = this.group.add(this.sum, value);
    if (this.blocks===0) {
        set(this);
    }
    this.known[key] = function(){
        this.sum = this.group.add(this.sum, this.group.invert(value));
        if (this.blocks===0) {
            set(this);
        }
    }.bind(this);
};

function set(sigma) {
    if (sigma._ignoreSetUnset) return;
    sigma.set(sigma.sum);
}

function unset(sigma) {
    if (sigma._ignoreSetUnset) return;
    sigma.unset();
}