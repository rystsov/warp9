define(
["rere/reactive/Variable.Core", "rere/reactive/Variable.Extensions"], 
function(VariableCore, extensions) {
return function(rere) {

var Variable = VariableCore(rere);

Variable.prototype.coalesce = extensions(rere).coalesce;
return Variable;

};
});
