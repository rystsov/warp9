expose(Reducer, function(){
    Cell = root.reactive.Cell;
});

var Cell;

function Reducer(id, wrap, ignoreUnset) {
    this.id = id;
    this.inited = false;
    this.known = {};
    this.wrap = wrap;
    this.ignoreUnset = ignoreUnset;
    this._ignoreSetUnset = false;
}

function ReduceTree(id, monoid, wrap, ignoreUnset) {


    this.keyToIndex = {};
    this.indexToKey = [];
    this.monoid = monoid;
}

function Sigma(id, group, wrap, ignoreUnset) {
    this.id = id;
    this.inited = false;
    this.known = {};
    this.wrap = wrap;
    this.ignoreUnset = ignoreUnset;
    this._ignoreSetUnset = false;

    this.group = group;
}
