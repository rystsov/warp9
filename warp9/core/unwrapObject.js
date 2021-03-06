expose(unwrapObject, function(){
    Cell = root.core.cells.Cell;
    BaseCell = root.core.cells.BaseCell;
    BaseList = root.core.lists.BaseList;
    List = root.core.lists.List;
});

var Cell, BaseCell, List, BaseList;

function unwrapObject(obj, opt) {
    if (typeof obj == "function") {
        throw new Error("Can't unwrap functions");
    }
    if (typeof obj != "object") {
        return new Cell(obj);
    }
    if (obj instanceof Skip) return new Cell(obj);
    if (obj.metaType && obj.instanceof(BaseCell)) {
        return root.do(function(){
            return unwrapObject(obj.get()).get();
        });
    }
    if (obj.metaType && obj.instanceof(BaseList)) {
        return obj.lift(unwrapObject).reduce(
            [], function(a,b) { return a.concat(b); }, {
                wrap: function(x) { return [x]; },
                ignoreUnset: true
            }
        );
    }
    var disassembled = [];
    for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        if (typeof obj[key] == "function") continue;
        (function(key){
            disassembled.push(unwrapObject(obj[key]).lift(function(value){
                return new Skip({key: key, value: value});
            }));
        })(key);
    }
    return unwrapObject(new List(disassembled)).lift(function(items){
        var obj = {};
        for (var i=0;i<items.length;i++) {
            var kv = items[i].value;
            obj[kv.key] = kv.value;
        }
        return obj;
    });
}

function Skip(value) {
    this.value = value;
}
