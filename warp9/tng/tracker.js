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

Tracker.prototype.inScope = function(fn, context) {
    this.active = true;
    this.tracked = [];
    try {
        return fn.apply(context, []);
    } finally {
        this.active = false;
        this.tracked = null;
    }
};

Tracker.prototype.outScope = function(fn, context) {
    var active = this.active;
    this.active = false;
    try {
        return fn.apply(context, []);
    } finally {
        this.active = active;
    }
};
