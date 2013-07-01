define([], function() {
return function(rere) {

return function(fragment) {
	var jq = rere.ui.jq;

    this.head = null;
    this.bindto = function(element) {
        element.place(fragment);
        this.head = element;
    };
    this.place = function(html) {
        jq.after(fragment, html);
    };
    this.remove = function() {
        jq.remove(fragment);
        this.place = function(html) {
            this.head.place(html);
        };
    };
};

};
});
