define([], function(){
return function(rere) {

return {
    h : function(element) {
        return {
            _is_html_element: true,
            element: element
        }
    },
    render : function(canvas, element) {
        var renderer = rere.ui.elements.renderer;
        var Container = rere.ui.elements.Container;

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
                    return new rere.ui.ComboBox().of(e[1]).default(e[2]).get();
                } else if (e[0]=="input-radio") {
                    return initSingle(new rere.ui.RadioInput(e[1]), e, 2).get();
                } else if (e[0]=="input-check") {
                    return initSingle(new rere.ui.CheckInput(e[1]), e, 2).get();
                } else if (e[0]=="label") {
                    return initContainer(new rere.ui.Label(), e, 1).get();
                } else {
                    throw new Error();
                }
            } else if (e["_is_html_element"]) {
                return lift(e.element);
            } else {
                return e;
            }

            function initContainer(container, html, i) {
                if (html.length>i) {
                    if ((html[i] instanceof Array)&&(html[i][0]=="@")) {
                        var attributes = {}
                        var attr = html[i]
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
                        container.attributes(attributes);
                        i++;
                    }
                }
                var content = [];
                for(;i<html.length;i++) {
                    if (typeof html[i] == 'string' || html[i] instanceof String) {
                        content.push(new rere.ui.Text(html[i]));
                    } else {
                        content.push(flow(html[i]));
                    }
                }
                container.content(content);
                return container;
            }

            function initSingle(element, html, i) {
                if (html.length>i) {
                    if ((html[i] instanceof Array)&&(html[i][0]=="@")) {
                        var attributes = {}
                        var attr = html[i]
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
                        container.attributes(attributes);
                        i++;
                    }
                }
                return element;
            }
        }

        renderer.render(flow(element)).bindto(new Container(canvas));
    }
};

};
});
