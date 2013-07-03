define(
["rere/reactive/ObservableList.Core", "rere/reactive/ObservableList.collector", "rere/reactive/ObservableList.tolist", "rere/reactive/ObservableList.flatten"], 
function(ObservableListCore, collector, tolist, flatten) {
return function(rere) {

var ObservableList = ObservableListCore(rere);
var packrat = collector(rere);

ObservableList.collector = packrat.add;
ObservableList.prototype.addList = packrat.addList;
ObservableList.prototype.addRv = packrat.addRv;
ObservableList.prototype.flatten = flatten(rere);
ObservableList.tolist = tolist(rere);

return ObservableList;

};
});