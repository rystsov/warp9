expose(new EventBroker());

var
    CHANGED = "changed", CALL = "call", NOTIFY = "notify", NOTIFY_SINGLE = "notify-single";

function EventBroker() {
    this.events = [];
    this.active = false;
    this.isOnProcessCall = false;
}

EventBroker.prototype.emitChanged = function(node) {
    this.events.push({
        type: CHANGED,
        node: node
    });
    this.process();
};

EventBroker.prototype.emitCall = function(fn) {
    if (this.active) {
        fn()
    } else {
        this.events.push({
            type: CALL,
            fn: fn
        });
        this.process();
    }
};

EventBroker.prototype.emitNotify = function(node) {
    this.events.push({
        type: NOTIFY,
        node: node
    });
    this.process();
};

EventBroker.prototype.emitNotifySingle = function(node, f) {
    this.events.push({
        type: NOTIFY_SINGLE,
        node: node,
        f: f
    });
    this.process();
};

EventBroker.prototype.invokeOnProcess = function(obj, f, args) {
    if (this.isOnProcessCall) {
        return f.apply(obj, args);
    } else {
        this.isOnProcessCall = true;
        var result = f.apply(obj, args);
        this.isOnProcessCall = false;
        this.process();
        return result;
    }
};

EventBroker.prototype.process = function() {
    if (this.active) return;

    this.active = true;
    this.isOnProcessCall = true;
    while (this.events.length>0) {
        var event = this.events.shift();
        if (event.type === CHANGED) {
            root.tng.dag.DAG.notifyChanged(event.node);
            root.tng.dag.DAG.propagate();
        } else if (event.type === CALL) {
            event.fn();
        } else if (event.type === NOTIFY) {
            event.node.dependants.forEach(function(d){
                d.f(event.node);
            });
        } else if (event.type === NOTIFY_SINGLE) {
            event.f(event.node);
        } else {
            throw new Error();
        }
    }
    this.active = false;
    this.isOnProcessCall = false;
};