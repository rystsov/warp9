define(
["rere/reactive/Variable.Core"], 
function(VariableCore) {

var extensions = {
    coalesce: function(filler) {
        var self = this;
        var result = new VariableCore();
        result.onDispose(self.onEvent(VariableCore.handler({
            set: function (e) { result.set(e); },
            unset: function () { result.set(filler); }
        })));
        return result;
    }
};

return extensions;

});