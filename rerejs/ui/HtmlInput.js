define([], function(){
return function(rere) {

var id = 0;


var propertyBind = (function(special){
    function defaultMap(view, name, value) {
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
        if (typeof value==="object" && value["rere/reactive/Channel"]) {
            value.onEvent(rere.reactive.Variable.handler({
                set: template.set,
                unset: template.unset
            }));
        } else {
            template.set(value);
        }
    }
    return function(view, name, value) {
        var setter = name in special ? special[name](view, value) : defaultMap(view, name, value);
        
        wrapRv(value, setter);
    };
})({
    checked: function(view, value) {
        return {
            set: function(v) { 
                view.checked = v; 
            },
            unset: function() { 
                view.checked = false; 
            }
        };
    }
});

return (function() {
    this.id = "html_input_" + (id++);
    this._ui_is = true;
    this._ui_is_html_input = true;
    this.data = {
        attributes: {},
        events: {}
    };
    this.attributes = function(attributes) {
        if ("id" in attributes) {
            this.id = attributes.id
        }
        this.data.attributes = attributes
        return this;
    };
    this.events = function(events) {
        this.data.events = events
        return this;
    };
    this.get = function() {
        return this;
    };
    this.view = function(element) {
        var self = this;

        var jq = rere.ui.jq;
        var Variable = rere.reactive.Variable;
        var FragmentElement = rere.ui.elements.FragmentElement;

        var input = document.createElement("input");
        
        for (var name in element.data.attributes) {
            if (name=="css") continue;
            
            propertyBind(input, name, element.data.attributes[name]);
        }
        
        for (var name in element.data.events) {
            input.addEventListener(name, function() {
                element.data.events[name](self, input);
            }, false);
        }

        if ("css" in element.data.attributes) {
            for (var property in element.data.attributes["css"]) {
                (function(property, value){
                    if (value["rere/reactive/Channel"]) {
                        value.onEvent(Variable.handler({
                            set: function(e) { jq.css(input, property, e); },
                            unset: function() { jq.css(input, property, null); }
                        }))
                    } else {
                        jq.css(input, property, value);
                    };
                })(property, element.data.attributes["css"][property]);
            };
        };

        return new FragmentElement(input);
    };
});

};
});
