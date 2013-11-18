var warp9 = require('../../target/warp9.common');
var List = warp9.core.lists.List;

module.exports = CellStore;

function CellStore(cell) {
    this.value = null;
    this.changes = 0;

    var dispose = cell.onChange(function(){
        this.changes++;
        var marker = {};
        var value = cell.get(marker);
        this.value = value === marker ? null : {
            value: value
        };
    }.bind(this));
    this.dispose = function() {
        dispose();
        this.clear();
    };
}

CellStore.prototype.has = function(value) {
    return this.value != null && this.value.value === value;
};

CellStore.prototype.get = function(alt) {
    return this.value == null ? alt : this.value.value;
};

CellStore.prototype.isEmpty = function() {
    return this.value == null;
};

CellStore.prototype.clear = function() {
    this.changes=0;
    this.value = null;
};