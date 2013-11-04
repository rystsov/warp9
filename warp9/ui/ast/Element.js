expose(Element, function(){
    jq = root.ui.jq;
    Cell = root.reactive.Cell;
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
            if (name=="css") continue;

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
        if ("css" in this.attributes) {
            for (var property in this.attributes["css"]) {
                if (!this.attributes["css"].hasOwnProperty(property)) continue;
                // TODO: unnecessary condition?!
                if (property.indexOf("warp9:")==0) continue;
                (function(property, value){
                    if (typeof value==="object" && value.type == Cell) {
                        this.cells[value.cellId] = value;
                        var unsubscribe = value.onEvent(Cell.handler({
                            set: function(e) { jq.css(view, property, e); },
                            unset: function() { jq.css(view, property, null); }
                        }));
                        value.leak(this.elementId);
                        this.disposes.push(function(){
                            unsubscribe();
                            value.seal(this.elementId);
                        }.bind(this));
                    } else {
                        jq.css(view, property, value);
                    }
                }.bind(this))(property, this.attributes["css"][property]);
            }
        }

        this.view = function() {
            throw new Error();
        };

        return view;
    };
}
