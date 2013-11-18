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

    root.unwrapObject = root.core.unwrapObject;

    root.Cell = root.core.cells.Cell;

    root.List = root.core.cells.List;
});

var id = 0;