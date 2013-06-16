define(
["rere/ui/jq"],
function(jq) {

return function(fragment) {
    this.bindto = function(element) {
        element.place(fragment);
    };
    this.place = function(html) {
        fragment.parentNode.insertBefore(html, fragment.nextSibling);
    };
    this.remove = function() {
        html.remove();
    };
}

});
