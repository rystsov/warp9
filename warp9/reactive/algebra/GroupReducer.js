expose(Sigma, function() {
    Cell = root.reactive.Cell;
});

var Cell;

function Sigma(id, group, wrap, ignoreUnset, callback) {
    this.id = id;
    this.wrap = wrap;
    this.ignoreUnset = ignoreUnset;
    this.group = group;
    this.callback = callback;

    this.sum = group.identity();
    this.isActive = true;
    this.known = {};
    this.inited = false;
    this.blocks = 0;
    this.reports = 0;
    this.count = 0;
}

Sigma.prototype.init = function(data) {
    if (this.inited) throw new Error();
    this.inited = true;
    this.count = data.length;
    data.forEach(function(item){
        this._add(item.key, item.value);
    }.bind(this));
    if (data.length==0) {
        this.callback(["set", this.sum]);
    }
};

Sigma.prototype.add = function(key, value) {
    this.count++;
    this._add(key, value);
};

Sigma.prototype._add = function(key, value) {
    var self = this;

    if (!(typeof value === "object" && value.type === Cell)) {
        value = new Cell(value);
    }
    var isActive = true;
    var isBlocked = false;
    var isReported = false;
    var last = null;

    value.leak(self.id);
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
        // TODO: remove (key, last)
        if (last != null) {
            self.sum = self.group.add(self.sum, self.group.invert(last.value));
            last = null;
        }
        //////////////////////
        isActive = false;
        dispose();
        value.seal(self.id);
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
        // TODO: upsert (key, x)
        if (last != null) {
            self.sum = self.group.add(self.sum, self.group.invert(last.value));
        }
        last = {
            value: self.wrap(x)
        };
        self.sum = self.group.add(self.sum, last.value);
        ///////////////////////
        self.raise();
    }

    function unset() {
        if (isBlocked) return;
        isBlocked = true;
        self.blocks++;
        // TODO: upsert (key, last, identity)
        if (last != null) {
            self.sum = self.group.add(self.sum, self.group.invert(last.value));
        }
        last = null;
        ///////////////////////
        if (self.blocks==1) {
            self.raise();
        }
    }
};

Sigma.prototype.raise = function() {
    if (this.count != this.reports) return;
    if (!this.ignoreUnset && this.blocks>0) {
        this.callback(["unset"]);
        return;
    }
    this.callback(["set", this.sum]);
};

Sigma.prototype.remove = function(key) {
    if (!this.known.hasOwnProperty(key)) {
        throw new Error("Unknown key: " + key);
    }
    this.known[key]();
    delete this.known[key];
    this.raise();
};

Sigma.prototype.dispose = function() {
    this.isActive = false;
    var keys = [];
    for (var key in this.known) {
        if (!this.known.hasOwnProperty(key)) continue;
        this.known[key]();
        keys.push(key);
    }
    keys.forEach(function(key) { delete this.known[key] }.bind(this));
};