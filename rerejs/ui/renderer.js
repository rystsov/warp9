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
            h.s = function(state) {
                return {
                    _is_html_state: true,
                    state: state
                }
            }
            return h;
        })(),
        tags: {},
        addTag: function(name, factory, builder) {
            this.tags[name]={ factory: factory, builder: builder }
        },
        tag: function(name) {
            return this.tags[name].factory;
        },
        addPithyTag: function(tag, factory) {
            var renderer = this;
            factory = factory || function() {
                return new function() {
                    rere.ui.Element.ctor.apply(this);
                    this.view = function(element){
                        return rere.ui.Element.renderContainer(element, document.createElement(tag));
                    };
                };
            };
            renderer.addTag(tag, factory, function(info){
                var element = info.state ? factory(info.state) : factory();
                if (info.attributes) element.attributes(info.attributes);
                if (info.events) element.events(info.events);

                element.content(info.casual.map(function(item){
                    if (typeof item == 'string' || item instanceof String) {
                        return new rere.ui.Text(item);
                    } else {
                        return renderer.parse(item);
                    }
                }));
                return element.get();
            });
        },
        addVoidTag : function(tag, factory) {
            var renderer = this;
            factory = factory || function() {
                return new function() {
                    rere.ui.Element.ctor.apply(this);
                    this.view = function(element){
                        return rere.ui.Element.renderSingle(element, document.createElement(tag));
                    };
                };
            };
            renderer.addTag(tag, factory, function(info){
                var element = info.state ? factory(info.state) : factory();
                if (info.attributes) element.attributes(info.attributes);
                if (info.events) element.events(info.events);
                return element.get();
            });
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
                    if (!(e[0] in self.tags)) {
                        throw new Error("Unknown tag: " + e[0]);
                    }
                    return self.tags[e[0]].builder(parseSpecial(e))
                } else if (e["_is_html_element"]) {
                    return lift(e.element);
                } else {
                    return e;
                }

                function parseSpecial(args) {
                    var result = {
                        /*attributes: {},
                        events: {},
                        state:*/
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
                        if ((typeof args[i] === "object")&&(args[i]._is_html_state)) {
                            if ("state" in result) throw new Error("state may be set only once");
                            result.state = args[i].state;
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
