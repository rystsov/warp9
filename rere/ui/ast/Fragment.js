expose(Fragment);

function Fragment(html) {
    this.type = Fragment;
    this.dispose = function() {};
    this.children = [];
    this.events = {};
    this.cells = {};
    this.view = function() {
        this.view = function() {
            throw new Error();
        };

        return html;
    };
}