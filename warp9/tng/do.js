expose(_do, function(){
    DependentCell = root.tng.reactive.DependentCell;
});

var DependentCell;

function _do(f) {
    return new DependentCell(f);
}