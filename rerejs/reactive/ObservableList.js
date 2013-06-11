define(
["rere/reactive/ObservableList.Core", "rere/reactive/ObservableList.collector", "rere/reactive/ObservableList.tolist"], 
function(ObservableListCore, collector, tolist) {

ObservableListCore.collector = collector;
ObservableListCore.tolist = tolist;
return ObservableListCore;

});