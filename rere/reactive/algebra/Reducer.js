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

    this.init = init;
    this.dispose = dispose;
    this.remove = remove;
    this.add = add;
}

function init(data) {
    if (this.inited) {
        throw new Error("Can't init object twice, to reset use 'dispose'")
    }
    this.inited = true;
    this._ignoreSetUnset = true;
    this.known = {};
    this._setIdentity();
    this.blocks = 0;
    if (data) data.forEach(function(item){
        this.add(item.key, item.value);
    }.bind(this));
    this._ignoreSetUnset = false;
    // TODO: call unset
    if (this.blocks===0) {
        this._set(this);
    }
}

function dispose() {
    if (!this.inited) return;
    this._ignoreSetUnset = true;
    for (var key in this.known) {
        if (!this.known.hasOwnProperty(key)) continue;
        this.known[key]();
    }
    this._ignoreSetUnset = false;
    this.inited = false;
    this.known = {};
    if (this.blocks!=0) throw new Error();
}

function remove(key) {
    if (!this.inited) {
        throw new Error("Reducer is not inited");
    }
    if (!this.known.hasOwnProperty(key)) {
        throw new Error("Trying to delete unknown key: " + key);
    }
    this.known[key]();
    delete this.known[key];
}

function add(key, value) {
    if (!this.inited) {
        throw new Error("Reducer is not inited");
    }
    if (this.known.hasOwnProperty(key)) {
        throw new Error("Trying to add a already known key: " + key);
    }
    if (typeof value === "object" && value.type === Cell) {
        this.addCell(key, value);
    } else {
        this.addValue(key, value);
    }
};