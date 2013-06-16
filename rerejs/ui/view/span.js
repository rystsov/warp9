define(
["rere/ui/jq", "rere/ui/elements/renderer", "rere/ui/elements/Container", "rere/reactive/Variable"], 
function(jq, renderer, Container, Variable) {

return (function(element) {
    var span = document.createElement("span");
    for (var name in element.data.attributes) {
        if (name=="css") continue;
        span.setAttribute(name, element.data.attributes[name]);
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

    return {
        head: null,
        bindto: function(head) {
            renderer.render(element.data.content).bindto(new Container(span));
            head.place(span);
            this.head = head;
        },
        place: function(html) {
            jq.after(span, html);
        },
        remove: function() {
            jq.remove(span);
            this.place = function(html) {
                this.head.place(html);
            };
        }
    };
});

});
