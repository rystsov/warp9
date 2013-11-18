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
    this.isEqualTo = function(brother) {
        if (brother==null) return false;
        return !brother.isEmpty() && brother.value() === value;
    };
    this.unwrap = function() {
        return value;
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
    this.isEqualTo = function(brother) {
        if (brother==null) return false;
        return brother.isEmpty();
    };
    this.unwrap = function(alt) {
        if (arguments.length==0) {
            throw new root.core.cells.EmptyError();
        }
        return alt;
    };
}
