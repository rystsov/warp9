define(["rere/core/equalator"], function(equalator) {
    return {
        "Some": (function some(value) {
            this._m_is_maybe = true;
            this.value = function() {
                return value;
            };
            this.isempty = function() {
                return false;
            };
            this.hasvalue = function(value) {
                return equalator.areEquals(value, this.value())
            };
            this.lift = function(f) {
                return new some(f(value));
            };
            this[equalator.hook] = function(b) {
                if (!b._m_is_maybe) return false;
                if (b.isempty()) return false;
                return equalator.areEquals(this.value(), b.value());
            };
        }),
        "None": function() {
            this._m_is_maybe = true;
            this.value = function() {
                throw new Error();
            };
            this.isempty = function() {
                return true;
            };
            this.hasvalue = function() {
                return false;
            };
            this.lift = function() {
                return this;
            };
            this[equalator.hook] = function(b) {
                if (!b._m_is_maybe) return false;
                return b.isempty();
            };
        }
    }
});
