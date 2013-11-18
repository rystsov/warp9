expose(Node, function(){});


function Node() {
    this.attach(Node);
    this.nodeId = root.uid();
    this.changed = {};
    this.delta = null;
    this.nodeRank = 0;
}
