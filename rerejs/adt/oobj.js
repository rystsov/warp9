define(
    ["rere/core/maybe", "rere/reactive/Variable"], 
    function(maybe, Variable) {
        return function() {
            this._props = {};
            this.get = function(prop) {
                if (!(prop in this._props)) {
                    this._props[prop] = new Variable(new maybe.None());
                }
                return this._props[prop];
            };
            this.set = function(prop, value) {
                this.get(prop).set(new maybe.Some(value));
            };
            this.rm = function(prop) {
                this.get(prop).set(new maybe.None());
            };
        }
    }
);
