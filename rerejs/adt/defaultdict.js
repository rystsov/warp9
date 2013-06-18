define([], function() {
return function(rere) {

return function(init) {
    this.init = init;
    this.data = {};
    this.set = function(key, value) {
        this.data[key] = value;
    };
    this.get = function(key) {
        if (!(key in this.data)) {
            this.data[key] = this.init();
        }
        return this.data[key];
    };
    this.remove = function(key) {
        delete this.data[key];
    };
};

};
});
