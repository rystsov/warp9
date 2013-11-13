expose(Node, function(){});


function Node() {
    this.attach(Node);
    this.nodeId = root.idgenerator();
    this.changed = {};
    this.delta = null;
    this.nodeRank = 0;
}
