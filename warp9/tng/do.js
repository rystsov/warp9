expose(_do, function(){
    DependentCell = root.core.cells.DependentCell;
});

var DependentCell;

function _do(f, context) {
    return new DependentCell(f, context);
}