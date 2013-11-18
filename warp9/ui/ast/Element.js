expose(Element, function(){
    jq = root.ui.jq;
    //TODO: TOTNG
    //Cell = root.reactive.Cell;
    register = root.ui.attributes.register;
});

var jq, Cell, register;

var id = 0;

function Element(tag) {
    this.type = Element;

    this.tag = tag;
    this.events = {};
    this.children = [];
    this.attributes = {};
    this.css = {};
    this.onDraw = [];

    this.elementId = "warp9/" + (id++);

    this.disposes = [];
    this.cells = {};
    this.dispose = function() {
        this.disposes.forEach(function(x) { x(); });

        this.dispose = function() { throw new Error(); }
    };

    this.view = function() {
        var view = document.createElement(tag);

        for (var name in this.attributes) {
            if (!this.attributes.hasOwnProperty(name)) continue;
            var setter = register.findAttributeSetter(this.tag, name);
            this.disposes.push(setter.apply(name, this, view, this.attributes[name]));
        }

        for (var name in this.events) {
            if (!this.events.hasOwnProperty(name)) continue;
            (function(name){
                view.addEventListener(name, function(event) {
                    this.events[name](this, view, event);
                }.bind(this), false);
            }.bind(this))(name);
        }

        for (var name in this.css) {
            if (!this.css.hasOwnProperty(name)) continue;
            // TODO: unnecessary condition?!
            if (name.indexOf("warp9:")==0) continue;
            (function(name, value){
                if (typeof value==="object" && value.type == Cell) {
                    this.cells[value.cellId] = value;
                    var unsubscribe = value.onEvent(Cell.handler({
                        set: function(e) { jq.css(view, name, e); },
                        unset: function() { jq.css(view, name, null); }
                    }));
                    value.leak(this.elementId);
                    this.disposes.push(function(){
                        unsubscribe();
                        value.seal(this.elementId);
                    }.bind(this));
                } else {
                    jq.css(view, name, value);
                }
            }.bind(this))(name, this.css[name]);
        }

        this.view = function() {
            throw new Error();
        };

        return view;
    };
}
