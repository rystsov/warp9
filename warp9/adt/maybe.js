expose({
    Some: Some,
    None: None
});

function Some(value) {
    this.value = function() {
        return value;
    };
    this.isEmpty = function() {
        return false;
    };
    this.lift = function(f) {
        return new Some(f(value));
    };
}

function None() {
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