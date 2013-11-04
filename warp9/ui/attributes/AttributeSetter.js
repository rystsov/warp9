expose(AttributeSetter);

function AttributeSetter() {
    this.type = AttributeSetter;
}

// returns dispose
AttributeSetter.prototype.apply = function(attribute, element, view, value) {
    throw new Error();
};
