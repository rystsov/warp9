define([], function() {
return function(rere) {

return function(fragment) {
	var jq = rere.ui.jq;

    this.bindto = function(element) {
        element.place(fragment);
    };
    this.place = function(html) {
        fragment.parentNode.insertBefore(html, fragment.nextSibling);
        jq.after(fragment, html);
    };
    this.remove = function() {
        html.remove();
    };
};

};
});
