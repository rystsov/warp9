expose(new Tracker());

function Tracker() {
    this.active = false;
    this.tracked = null;
    this.stack = [];
}

Tracker.prototype.track = function(cell) {
    if (!this.active) return;
    // TODO: optimize
    if (this.tracked.indexOf(cell)>=0) return;
    this.tracked.push(cell);
};

Tracker.prototype.inScope = function(fn, context) {
    this.stack.push([this.active, this.tracked]);

    this.active = true;
    this.tracked = [];
    try {
        return fn.apply(context, []);
    } finally {
        var last = this.stack.pop();
        this.active = last[0];
        this.tracked = last[1];
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
