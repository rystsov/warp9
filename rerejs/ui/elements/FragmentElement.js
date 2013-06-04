define(function() {
    return function(fragment) {
        this.bindto = function(element) {
            element.place(fragment);
        };
        this.place = function(html) {
            fragment.after(html);
        };
        this.remove = function() {
            html.remove();
        };
    }
});
