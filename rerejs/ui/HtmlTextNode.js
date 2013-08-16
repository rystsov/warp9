expose(HtmlTextNode);

function HtmlTextNode(text) {
    this.type = HtmlTextNode;
    this.dispose = function() {};
    this.children = [];
    this.events = {};
    this.view = function() {
        var view = document.createTextNode(text);

        this.view = function() {
            throw new Error();
        };

        return view;
    };
}