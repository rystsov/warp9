define(
["rere/reactive/Cell", "rere/reactive/GC"],
function(Cell, GC) {
return function(rere) {

return {
    Cell : Cell(rere),
    GC : GC(rere)
};

};
});
