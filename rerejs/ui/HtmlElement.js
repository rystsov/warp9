define([], function(){
return function(rere) {


function HtmlElement(tag) {
    var jq = rere.ui.jq;
    var Cell = rere.reactive.Cell;

    this.type = HtmlElement;
    this.tag = tag;
    this.attributes = {};
    this.events = {};
    this.children = [];

    this.attributeSetters = defaultAttributeSetters();

    this.dispose = function() {};
    this.view = function() {
        var view = document.createElement(tag);

        for (var name in this.attributes) {
            if (name=="css") continue;
            this.setAttribute(view, name, this.attributes[name])
        }

        for (var name in this.events) {
            (function(name){
                if (name == "control:draw") return;
                if (name == "key:enter") {
                    view.addEventListener("keypress", function(event) {
                        if (event.keyCode == 13) {
                            this.events[name](this, view, event);
                        }
                    }.bind(this), false);
                } else {
                    view.addEventListener(name, function(event) {
                        this.events[name](this, view, event);
                    }.bind(this), false);
                }
            }.bind(this))(name);
        }

        if ("css" in this.attributes) {
            for (var property in this.attributes["css"]) {
                (function(property, value){
                    if (typeof value==="object" && value.type == Cell) {
                        value.onEvent(Cell.handler({
                            set: function(e) { jq.css(view, property, e); },
                            unset: function() { jq.css(view, property, null); }
                        }));
                    } else {
                        jq.css(view, property, value);
                    }
                })(property, this.attributes["css"][property]);
            }
        }

        this.view = function() {
            throw new Error();
        };

        return view;
    };
    this.setAttribute = function(view, name, value) {
        if (name in this.attributeSetters) {
            wrapRv(value, this.attributeSetters[name](view));
        } else {
            wrapRv(value, defaultMap(view, name));
        }

        function defaultMap(view, name) {
            return {
                set: function(v) { view.setAttribute(name, v); },
                unset: function() {
                    if (view.hasAttribute(name)) {
                        view.removeAttribute(name);
                    }
                }
            }
        }

        function wrapRv(value, template) {
            if (typeof value==="object" && value.type == Cell) {
                value.onEvent([], rere.reactive.Cell.handler({
                    set: template.set,
                    unset: template.unset
                }));
            } else {
                template.set(value);
            }
        }
    };
}

return HtmlElement;

function defaultAttributeSetters() {
    return {
        checked: function(view, value) {
        	        return {
        	            set: function(v) {
        	                view.checked = v;
        	            },
        	            unset: function() {
        	                view.checked = false;
        	            }
        	        };
        	    },
        value: function(view, value) {
            return {
                set: function(v) {
                    if (view.value!=v) view.value = v;
                },
                unset: function() {
                    if (view.value!="") view.value = "";
                }
            };
        },
        disabled: function(view, value) {
            return {
                set: function(v) {
                    if (v) {
                        view.setAttribute("disabled", "")
                    } else {
                        if (view.hasAttribute("disabled")) view.removeAttribute("disabled");
                    }
                },
                unset: function() {
                    view.removeAttribute("disabled");
                }
            };
        },
        "class": function(view, value) {
            var jq = rere.ui.jq;
            return {
                set: function(v) {
                    jq.removeClass(view);
                    view.classList.add(v);
                },
                unset: function() {
                    jq.removeClass(view);
                }
            };
        }
    };
}

};
});
