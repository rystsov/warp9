var dag = new DAG();

expose(dag, function(){
    Node = root.tng.dag.Node;
    Set = root.adt.Set;
    SortedList = root.adt.SortedList;
    event_broker = root.tng.event_broker;

    dag.reset();
});

var Node, SortedList, Set, event_broker;

function DAG() {}

DAG.prototype.reset = function() {
    this.nodes = {};
    this.length = 0;
    this.dependencies = {};
    this.dependants = {};

    this.changed = new SortedList(function(a,b){
        return a.nodeRank - b.nodeRank;
    });
};

DAG.prototype.addNode = function(node) {
    if (knownNode(this, node)) {
        throw new Error();
    }
    this.nodes[node.nodeId] = node;
    this.dependencies[node.nodeId] = [];
    this.dependants[node.nodeId] = [];
    this.length++;
};

DAG.prototype.removeNode = function(node) {
    if (!knownNode(this, node)) {
        throw new Error();
    }
    if (this.dependants[node.nodeId].length!=0) {
        throw new Error();
    }
    if (this.dependencies[node.nodeId].length!=0) {
        throw new Error();
    }
    delete this.nodes[node.nodeId];
    delete this.dependants[node.nodeId];
    delete this.dependencies[node.nodeId];
    this.length--;
};

DAG.prototype.addRelation = function(from, to) {
    if (inRelation(this, from, to) || inRelation(this, to, from)) {
        throw new Error();
    }
    this.dependencies[to.nodeId].push(from.nodeId);
    this.dependants[from.nodeId].push(to.nodeId);
    calcRank(this, to);
};

DAG.prototype.removeRelation = function(from, to) {
    if (!inRelation(this, from, to)) {
        throw new Error();
    }

    var len = this.dependencies[to.nodeId].length;
    this.dependencies[to.nodeId] = this.dependencies[to.nodeId].filter(function(item){
        return item != from.nodeId;
    });
    if (len != this.dependencies[to.nodeId].length+1) throw new Error();

    len = this.dependants[from.nodeId].length;
    this.dependants[from.nodeId] = this.dependants[from.nodeId].filter(function(item){
        return item != to.nodeId;
    });
    if (len != this.dependants[from.nodeId].length+1) throw new Error();

    calcRank(this, to);
};

DAG.prototype.notifyChanged = function(node) {
    if (!knownNode(this, node)) {
        throw new Error();
    }
    this.changed.push(node);
};

DAG.prototype.propagate = function() {
    while (this.changed.length>0) {
        var front = this.changed.pop();
        var info = front.dependenciesChanged();
        if (!info.hasChanges) continue;

        for (var i=0;i<this.dependants[front.nodeId].length;i++) {
            var node = this.nodes[this.dependants[front.nodeId][i]];
            if (!node.changed.hasOwnProperty(front.nodeId)) {
                node.changed[front.nodeId] = [];
            }
            for (var j=0;j<info.changeSet.length;j++) {
                node.changed[front.nodeId].push(info.changeSet[j]);
            }
            this.changed.push(node);
        }
    }
};

function knownNode(dag, node) {
    if (!node.instanceof(Node)) {
        throw new Error();
    }
    return dag.nodes.hasOwnProperty(node.nodeId);
}

function inRelation(dag, from, to) {
    if (!knownNode(dag, from) || !knownNode(dag, to)) {
        throw new Error();
    }
    if (dag.dependencies[to.nodeId].indexOf(from.nodeId) >= 0) {
        if (dag.dependants[from.nodeId].indexOf(to.nodeId)<0) {
            throw new Error();
        }
        return true;
    } else {
        if (dag.dependants[from.nodeId].indexOf(to.nodeId)>=0) {
            throw new Error();
        }
    }
    return false;
}

function calcRank(dag, node) {
    var rank = 0;
    dag.dependencies[node.nodeId].forEach(function(nodeId){
        rank = Math.max(dag.nodes[nodeId].nodeRank+1, rank);
    });
    node.nodeRank = rank;
}