define(
["rere/ui/jq", "rere/ui/elements/renderer", "rere/ui/elements/Container"], 
function(jq, renderer, Container) {

return (function(element) {
    var div = document.createElement("div");
    for (var name in element.data.attributes) {
        if (name=="css") continue;
        div.setAttribute(name, element.data.attributes[name]);
    }
    
    if ("css" in element.data.attributes) {
        for (var property in element.data.attributes["css"]) {
            (function(property, value){
                if (value["rere/reactive/Channel"]) {
                    value.onEvent(Variable.handler({
                        set: function(e) { jq.css(div, property, e); },
                        unset: function() { jq.css(div, property, null); }
                    }))
                } else {
                    jq.css(div, property, value);
                };
            })(property, element.data.attributes["css"][property]);
        };
    };

    return {
        head: null,
        bindto: function(head) {
            renderer.render(element.data.content).bindto(new Container(div));
            head.place(div);
            this.head = head;
        },
        place: function(html) {
            jq.after(div, html);
        },
        remove: function() {
            jq.remove(div);
            this.place = function(html) {
                this.head.place(html);
            };
        }
    };
});

});
