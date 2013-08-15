define([], function(){
return function(rere) {

function HtmlDomElement(element) {
    var jq = rere.ui.jq;
    var Container = rere.ui.elements.Container;

    this.bindto = function(preceding) {
        if ("preceding" in this) throw new Error();
        this.preceding = preceding;
        this.view = element.view();
        preceding.place(this.view);

        if (element.children instanceof Array) {
            if (element.children.length!=0) {
                rere.ui.HtmlDom.wrap(element.children).bindto(new Container(this.view));
            }
        } else {
            throw new Error();
        }

        if ("control:draw" in element.events) {
            element.events["control:draw"](element, this.view);
        }
    };
    this.place = function(follower) {
        if (!("preceding" in this)) throw new Error();
        jq.after(this.view, follower);
    };
    this.remove = function() {
        if (!("preceding" in this)) throw new Error();
        jq.remove(this.view);
        element.dispose();
        this.place = function(follower) { this.preceding.place(follower); };
        this.remove = function() { throw new Error(); }
    };
}

return HtmlDomElement;

};
});
