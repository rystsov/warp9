define([], function() {
return function(rere) {

return function(fragment, events) {
	var jq = rere.ui.jq;

    this.head = null;
    this.bindto = function(element) {
        element.place(fragment);
        this.head = element;
        if (events && events.draw) events.draw();
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
