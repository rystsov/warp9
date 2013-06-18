define([], function() {
return function(rere) {

return {
    coalesce: function(filler) {
        var Variable = rere.reactive.Variable;

        var self = this;
        var result = new Variable();
        result.onDispose(self.onEvent(Variable.handler({
            set: function (e) { result.set(e); },
            unset: function () { result.set(filler); }
        })));
        return result;
    }
};

};
});