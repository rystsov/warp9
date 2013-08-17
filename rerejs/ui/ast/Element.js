expose(Element);

var id = 0;

function Element(tag) {
    var jq = root.ui.jq;
    var Cell = root.reactive.Cell;

    this.type = Element;
    this.tag = tag;
    this.attributes = {};
    this.events = {};
    this.children = [];
    this.elementId = "rere/ui/ast/element/" + (id++);

    this.attributeSetters = defaultAttributeSetters();

    this.disposes = [];
    this.dispose = function() {
        this.disposes.forEach(function(x) { x(); });
    };
    this.view = function() {
        var view = document.createElement(tag);

        for (var name in this.attributes) {
            if (!this.attributes.hasOwnProperty(name)) continue;
            if (name=="css") continue;
            this.setAttribute(view, name, this.attributes[name])
        }

        for (var name in this.events) {
            if (!this.events.hasOwnProperty(name)) continue;
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
                if (!this.attributes["css"].hasOwnProperty(property)) continue;
                (function(property, value){
                    if (typeof value==="object" && value.type == Cell) {
                        var unuse = function() {};
                        if (!value.hasUser(this.elementId)) {
                            value.addUser(this.elementId);
                            unuse = function() {
                                value.removeUser(this.elementId);
                            }.bind(this);
                        }
                        var dispose = value.onEvent(Cell.handler({
                            set: function(e) { jq.css(view, property, e); },
                            unset: function() { jq.css(view, property, null); }
                        }));
                        this.disposes.push(function(){
                            dispose();
                            unuse();
                        });
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
    this.setAttribute = function(view, name, value) {
        var self = this;
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
                var unuse = function() {};
                if (!value.hasUser(self.elementId)) {
                    value.addUser(self.elementId);
                    unuse = function() {
                        value.removeUser(self.elementId);
                    };
                }
                var dispose = value.onEvent([], Cell.handler({
                    set: template.set,
                    unset: template.unset
                }));
                self.disposes.push(function(){
                    dispose();
                    unuse();
                });
            } else {
                template.set(value);
            }
        }
    };
}

function defaultAttributeSetters() {
    return {
        checked: function(view) {
            return {
                set: function(v) {
                    view.checked = v;
                },
                unset: function() {
                    view.checked = false;
                }
            };
        },
        value: function(view) {
            return {
                set: function(v) {
                    if (view.value!=v) view.value = v;
                },
                unset: function() {
                    if (view.value!="") view.value = "";
                }
            };
        },
        disabled: function(view) {
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
        "class": function(view) {
            var jq = root.ui.jq;
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