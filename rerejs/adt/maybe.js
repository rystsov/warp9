define([], function() {
return function(rere) {

return {
    "Some": (function Some(value) {
        this.value = function() {
            return value;
        };
        this.isEmpty = function() {
            return false;
        };
        this.lift = function(f) {
            return new Some(f(value));
        };
    }),
    "None": function() {
        this.value = function() {
            throw new Error();
        };
        this.isEmpty = function() {
            return true;
        };
        this.lift = function() {
            return this;
        };
    }
};

};
});
