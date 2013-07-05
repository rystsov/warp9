define([], function(){
return function(rere) {

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
    parse: function(element) {
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
                if (e[0]=="div") {
                    return initContainer(new rere.ui.Div(), e, 1).get();
                } else if (e[0]=="span") {
                    return initContainer(new rere.ui.Span(), e, 1).get();
                } else if (e[0]=="combobox") {
                    var combobox = new rere.ui.ComboBox(e[2]);
                    combobox.content(e[1].map(function(item) {
                        var option = new rere.ui.Option();
                        option.attributes({
                            value: item[1]
                        });
                        option.content([item[0]]);
                        return option.get();
                    }));
                    return combobox.get();
                } else if (e[0]=="input-radio") {
                    return initSingle(new rere.ui.InputRadio(e[1]), e, 2).get();
                } else if (e[0]=="input-check") {
                    return initSingle(new rere.ui.InputCheck(e[1]), e, 2).get();
                } else if (e[0]=="input-text") {
                    return initSingle(new rere.ui.InputText(e[1]), e, 2).get();
                } else if (e[0]=="label") {
                    return initContainer(new rere.ui.Label(), e, 1).get();
                } else if (e[0]=="button") {
                    return initContainer(new rere.ui.Button(), e, 1).get();
                } else if (e[0]=="form") {
                    return initContainer(new rere.ui.Form(), e, 1).get();
                } else if (e[0]=="ul") {
                    return initContainer(new rere.ui.Ul(), e, 1).get();
                } else if (e[0]=="li") {
                    return initContainer(new rere.ui.Li(), e, 1).get();
                } else if (e[0]=="a") {
                    return initContainer(new rere.ui.A(), e, 1).get();
                } else if (e[0]=="section") {
                    return initContainer(new rere.ui.Section(), e, 1).get();
                } else if (e[0]=="header") {
                    return initContainer(new rere.ui.Header(), e, 1).get();
                } else if (e[0]=="footer") {
                    return initContainer(new rere.ui.Footer(), e, 1).get();
                } else if (e[0]=="h1") {
                    return initContainer(new rere.ui.H1(), e, 1).get();
                } else if (e[0]=="strong") {
                    return initContainer(new rere.ui.Strong(), e, 1).get();
                } else if (e[0]=="span") {
                    throw new Error();
                }
            } else if (e["_is_html_element"]) {
                return lift(e.element);
            } else {
                return e;
            }

            function initContainer(container, html, i) {
                var html = parseSpecial(html, i);
                if (html.attributes) container.attributes(html.attributes);
                if (html.events) container.events(html.events);

                container.content(html.casual.map(function(item){
                    if (typeof item == 'string' || item instanceof String) {
                        return new rere.ui.Text(item);
                    } else {
                        return flow(item);
                    }
                }));
                return container;
            }

            function initSingle(element, html, i) {
                var html = parseSpecial(html, i);
                if (html.attributes) element.attributes(html.attributes);
                if (html.events) element.events(html.events);
                return element;
            }

            function parseSpecial(args, begin) {
                var result = {
                    /*attributes: {},
                    events: {},*/
                    casual: []
                };
                for (var i=begin;i<args.length;i++) {
                    if ((args[i] instanceof Array)&&(args[i][0]=="@")) {
                        if (result.attributes) throw new Error("attributes may be set only once");
                        var attributes = {}
                        var attr = args[i]
                        for(var k=1;k<attr.length;k++) {
                            if (attr[k][0]=="css") {
                                attributes.css = {};
                                for (var j=1;j<attr[k].length;j++) {
                                    attributes.css[attr[k][j][0]] = attr[k][j][1];
                                }
                            } else {
                                attributes[attr[k][0]]=attr[k][1];
                            }
                        }
                        result.attributes = attributes;
                        continue;
                    }
                    if ((args[i] instanceof Array)&&(args[i][0]=="!")) {
                        if (result.events) throw new Error("events may be set only once");
                        if (args[i].length==2) {
                            result.events = args[i][1];
                        }
                        continue;
                    }
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

};
});


/*
renderer.addTag("tag", ctor, function(renderer, html){
    // html[0]=="tag"
    // renderer.tag("tag")==ctor
    // renderer.parse
    return new renderer.tag("tag");
});
*/
