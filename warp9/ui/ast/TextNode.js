expose(TextNode);

function TextNode(text) {
    this.type = TextNode;
    this.dispose = function() {};
    this.children = [];
    this.onDraw = [];
    this.events = {};
    this.cells = {};
    this.view = function() {
        var view = document.createTextNode(text);

        this.view = function() {
            throw new Error();
        };

        return view;
    };
}