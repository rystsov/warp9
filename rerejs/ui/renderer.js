define(["rere/ui/initHtml"], function(initHtml){
return function(rere) {

var renderer = build();

return initHtml(rere)(renderer);

function build() {
    return {
        h : (function(){
            var h = function(element) {
                return {
                    _is_html_element: true,
                    element: element
                }
            };
            h.at = function(attributes) {
                return {
                    _is_html_at: true,
                    attributes: attributes
                }
            };
            h.e = function(events) {
                return {
                    _is_html_events: true,
                    events: events
                }
            };
            return h;
        })(),
        tags: {},
        addTag: function(name, factory, builder) {
            this.tags[name]={ factory: factory, builder: builder }
        },
        tag: function(name) {
            return this.tags[name].factory;
        },
        parse: function(element) {
            var self = this;
            function lift(e) {
                if (e["_is_html_element"]) {
                    return flow(e.element);
                } else if (e["rere/reactive/Channel"]) {
                    return e.lift(function(v){
                        return lift(v);
                    });
                } else if (e instanceof Array ) {
                    return e.map(flow);
                } else if (e["_m_is_maybe"] ) {
                    return e.lift(flow);
                } else if (e["rere/reactive/ObservableList"] ) {
                    return e.lift(lift);
                } else {
                    throw Error();
                }
            }
            function flow(e) {
                if (e instanceof Array ) {
                    if (e.length==0) throw new Error("Where is the tag name?");
                    if (!(e[0] in self.tags)) throw new Error("Unknown tag: " + e[0]);
                    return self.tags[e[0]].builder(parseSpecial(e))
                } else if (e["_is_html_element"]) {
                    return lift(e.element);
                } else {
                    return e;
                }

                function parseSpecial(args) {
                    var result = {
                        /*attributes: {},
                        events: {},*/
                        casual: []
                    };
                    for (var i=1;i<args.length;i++) {
                        if ((typeof args[i] === "object")&&(args[i]._is_html_at)) {
                            if (result.attributes) throw new Error("attributes may be set only once");
                            result.attributes = args[i].attributes;
                            continue;
                        }
                        if ((typeof args[i] === "object")&&(args[i]._is_html_events)) {
                            if (result.events) throw new Error("events may be set only once");
                            result.events = args[i].events;
                            continue;
                        }
                        result.casual.push(args[i]);
                    }
                    return result;
                }
            }
            return flow(element);
        },
        render : function(canvas, element) {
            var renderer = rere.ui.elements.renderer;
            var Container = rere.ui.elements.Container;

            renderer.render(this.parse(element)).bindto(new Container(canvas));
        }
    };
}

};
});
