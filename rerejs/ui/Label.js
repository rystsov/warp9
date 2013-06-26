define([], function(){
return function(rere) {

return (function() {
    this._ui_is = true;
    this._ui_is_label = true;
    this.data = {
        content: {},
        attributes: {},
        events: {}
    };
    this.content = function(content) {
        this.data.content = content;
        return this;
    };
    this.attributes = function(attributes) {
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
        var renderer = rere.ui.elements.renderer;
        var Container = rere.ui.elements.Container;
        var FragmentElement = rere.ui.elements.FragmentElement;

        var span = document.createElement("label");
        
        for (var name in element.data.attributes) {
            if (name=="css") continue;

            span.setAttribute(name, element.data.attributes[name]);
        }

        for (var name in element.data.events) {
            span.addEventListener(name, function(){
                element.data.events[name](self, span);
            }, false);
        }
        
        if ("css" in element.data.attributes) {
            for (var property in element.data.attributes["css"]) {
                (function(property, value){
                    if (typeof value==="object" && value["rere/reactive/Channel"]) {
                        value.onEvent(Variable.handler({
                            set: function(e) { jq.css(span, property, e); },
                            unset: function() { jq.css(span, property, null); }
                        }))
                    } else {
                        jq.css(span, property, value);
                    };
                })(property, element.data.attributes["css"][property]);
            };
        };

        var fragment = new FragmentElement(span);
        var bindto = fragment.bindto;
        fragment.bindto = function(head) {
            bindto.apply(fragment, [head]);
            renderer.render(element.data.content).bindto(new Container(span));
        };
        return fragment;
    };
});

};
});
