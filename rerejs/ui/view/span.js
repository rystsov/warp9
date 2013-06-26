define([], function() {
return function(rere) {

var knownEvents = {"click": true};

return (function(element) {
    var jq = rere.ui.jq;
    var Variable = rere.reactive.Variable;
    var renderer = rere.ui.elements.renderer;
    var Container = rere.ui.elements.Container;
    var FragmentElement = rere.ui.elements.FragmentElement;

    var span = document.createElement("span");
    for (var name in element.data.attributes) {
        if (name=="css") continue;
        span.setAttribute(name, element.data.attributes[name]);
    }

    for (var name in element.data.events) {
        if (!knownEvents[name]<0) {
            throw new Error("Unknown event: " + name);
        }
        if ("click"==name) {
            span.addEventListener("click", function(){
                element.data.events["click"](element);
            }, false);
        }
    }
    
    if ("css" in element.data.attributes) {
        for (var property in element.data.attributes["css"]) {
            (function(property, value){
                if (value["rere/reactive/Channel"]) {
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
});

};
});
