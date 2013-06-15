define(
["rere/reactive/Variable.Core", "rere/reactive/Variable.Extensions"], 
function(VariableCore, extensions) {

    VariableCore.prototype.coalesce = extensions.coalesce;
    return VariableCore;

});
