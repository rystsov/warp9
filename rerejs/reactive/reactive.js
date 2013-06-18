define(
["rere/reactive/Variable", "rere/reactive/ObservableList", "rere/reactive/ReduceTree", "rere/reactive/rv"], 
function(Variable, ObservableList, ReduceTree, rv) {
return function(rere) {

return {
    "Variable" : Variable(rere),
    "ObservableList" : ObservableList(rere),
    "ReduceTree" : ReduceTree(rere),
    "rv" : rv(rere)
};

};
});
