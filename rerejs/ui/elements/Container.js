define(function() {
    return function(container) {
        this.bindto = function(element) {
            throw new Error();
        };
        this.place = function(html) {
            container.prepend(html);
        };
}});
