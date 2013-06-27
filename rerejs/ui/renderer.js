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
        var tk = rere.ui.tk;
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
                    return initContainer(tk.div(), e, 1).get();
                } else if (e[0]=="span") {
                    return initContainer(tk.span(), e, 1).get();
                } else if (e[0]=="combobox") {
                    return tk.combobox().of(e[1]).default(e[2]).get();
                } else if (e[0]=="input-radio") {
                    rere.ui
                    return tk.combobox().of(e[1]).default(e[2]).get();
                } else {
                    throw new Error();
                }
            } else if (e["_is_html_element"]) {
                return lift(e.element);
            } else {
                return e;
            }

            function initContainer(container, html, i) {
                if (html.length>1) {
                    if ((html[1] instanceof Array)&&(html[1][0]=="@")) {
                        var attributes = {}
                        var attr = html[1]
                        for(i=1;i<attr.length;i++) {
                            if (attr[i][0]=="css") {
                                attributes.css = {};
                                for (var j=1;j<attr[i].length;j++) {
                                    attributes.css[attr[i][j][0]] = attr[i][j][1];
                                }
                            } else {
                                attributes[attr[i][0]]=attr[i][1];
                            }
                        }
                        container.attributes(attributes);
                        i=2;
                    }
                }
                var content = [];
                for(;i<html.length;i++) {
                    if (typeof html[i] == 'string' || html[i] instanceof String) {
                        content.push(tk.text(html[i]));
                    } else {
                        content.push(flow(html[i]));
                    }
                }
                container.content(content);
                return container;
            }
        }

        renderer.render(flow(element)).bindto(new Container(canvas));
    }
};

};
});
