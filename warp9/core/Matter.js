expose(Matter);


function Matter() {
    this._atoms = [];
    this.instanceof = of;
    this.attach = attach;
    this.metaType = Matter;
}

function attach(atom) {
    if (this.instanceof(atom)) {
        return;
    }
    this._atoms.push(atom);
}

function of(atom) {
    for (var i=0;i<this._atoms.length;i++) {
        if (this._atoms[i]===atom) return true;
    }
    return false;
}