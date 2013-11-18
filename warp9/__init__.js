expose(null, function() {
    root.uid = function() {
        return id++;
    };

    root.do = function(f, context) {
        return new root.core.cells.DependentCell(f, context);
    };

    root.empty = function() {
        throw new root.core.cells.EmptyError();
    };
});

var id = 0;