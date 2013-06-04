define(["rere/ui/elements/renderer", "rere/ui/elements/Container"], function(renderer, Container) {
    return (function(element) {
        var attributes = {};
        for (var name in element.data.attributes) {
            if (name=="css") continue;
            attributes[name]=element.data.attributes[name];
        }
        var div = $("<div/>", attributes);
        
        element.visibility.subscribe(function(value) {
            value = value ? "block" : "none";
            div.css("display", value);
        });

        if ("css" in element.data.attributes) {
            for (var property in element.data.attributes["css"]) {
                (function(property, value){
                    if (value["rere/reactive/Channel"]) {
                        value.subscribe(function(value){
                            div.css(property, value);
                        });
                    } else {
                        div.css(property, value);
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
                div.after(html);
            },
            remove: function() {
                div.remove();
                this.place = function(html) {
                    this.head.place(html);
                };
            }
        };
    });
});
