define(["rere/ui/elements/renderer", "rere/ui/elements/Container"], function(renderer, Container) {
    return (function(element) {
        var attributes = {};
        for (var name in element.data.attributes) {
            if (name=="css") continue;
            attributes[name]=element.data.attributes[name];
        }
        var span = $("<span/>", attributes);
        
        if ("css" in element.data.attributes) {
            for (var property in element.data.attributes["css"]) {
                (function(property, value){
                    if (value["rere/reactive/Channel"]) {
                        value.subscribe(function(value){
                            span.css(property, value);
                        });
                    } else {
                        span.css(property, value);
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
                span.after(html);
            },
            remove: function() {
                span.remove();
                this.place = function(html) {
                    this.head.place(html);
                };
            }
        };
    });
});
