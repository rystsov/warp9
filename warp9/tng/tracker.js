expose(new Tracker());

function Tracker() {
    this.active = false;
}

Tracker.prototype.track = function(cell) {
    if (!this.active) return;
    // TODO: optimize
    if (this.tracked.indexOf(cell)>=0) return;
    this.tracked.push(cell);
};

Tracker.prototype.inScope = function(fn, obj) {
    this.active = true;
    this.tracked = [];
    try {
        return fn.apply(obj, []);
    } finally {
        this.active = false;
        this.tracked = null;
    }
};

Tracker.prototype.outScope = function(fn) {
    var active = this.active;
    this.active = false;
    try {
        return fn();
    } finally {
        this.active = active;
    }
};
