define([], function() {
return function(rere) {

return {
    "Some": (function some(value) {
        this._m_is_maybe = true;
        this.value = function() {
            return value;
        };
        this.isempty = function() {
            return false;
        };
        this.lift = function(f) {
            return new some(f(value));
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
        this.lift = function() {
            return this;
        };
    }
};

};
});
