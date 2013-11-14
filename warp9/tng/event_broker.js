expose(new EventBroker());

function EventBroker() {
    this.changeRequests = [];

    // TODO: replace to set
    this.nodesToNotify = [];
    this.dependantsToNotify = [];

    this.active = false;
    this.isOnProcessCall = false;
}

EventBroker.prototype.postponeChange = function(node, change) {
    this.changeRequests.push({
        node: node,
        change: change
    });
    this.loop();
};

EventBroker.prototype.notify = function(node) {
    this.nodesToNotify.push(node);
};

EventBroker.prototype.notifySingle = function(node, dependant) {
    this.dependantsToNotify.push({node: node, dependant: dependant});
};

EventBroker.prototype.invokeOnProcess = function(obj, f, args) {
    if (this.isOnProcessCall) {
        return f.apply(obj, args);
    } else {
        this.isOnProcessCall = true;
        var result = f.apply(obj, args);
        this.isOnProcessCall = false;
        this.loop();
        return result;
    }
};

EventBroker.prototype.loop = function() {
    if (this.active) return;
    this.active = true;

    while(this.changeRequests.length + this.nodesToNotify.length + this.dependantsToNotify.length > 0) {
        var hasChanges = false;
        while (this.changeRequests.length!=0) {
            var request = this.changeRequests.shift();
            if (request.node.applyChange(request.change)) {
                hasChanges = true;
                if (request.node.usersCount > 0) {
                    root.tng.dag.DAG.notifyChanged(request.node);
                }
            }
        }
        if (hasChanges) {
            root.tng.dag.DAG.propagate();
        }
        if (this.nodesToNotify.length!=0) {
            var node = this.nodesToNotify.shift();
            node.sendAllMessages();
            continue;
        }
        if (this.dependantsToNotify.length!=0) {
            var info = this.dependantsToNotify.shift();
            info.node.sendItsMessages(info.dependant);
            continue;
        }
    }

    this.active = false;
};
