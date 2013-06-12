define(
["rere/reactive/ObservableList.Core", "rere/reactive/ObservableList.collector", "rere/reactive/ObservableList.tolist", "rere/reactive/ObservableList.flatten"], 
function(ObservableListCore, collector, tolist, flatten) {

ObservableListCore.collector = collector.add;
ObservableListCore.tolist = tolist;
ObservableListCore.prototype.addList = collector.addList;
ObservableListCore.prototype.flatten = flatten;
return ObservableListCore;

});