define(["rere/reactive/Variable", "rere/reactive/Channel", "rere/adt/maybe"], function(Variable, Channel, maybe) {
    function variable() {
        Variable.call(this);

        this["rere/reactive/ChannelWithMemory"] = true;
        this["rere/reactive/Variable/value"] = new maybe.None();
    
        this.T = variable;
        this.raise = function(value) {
            this["rere/reactive/Variable/value"] = new maybe.Some(value)
            Variable.raise(this, ["set", value])
        };

        if (arguments.length>0) {
            this.raise(arguments[0])
        }
    }
    return variable;
});