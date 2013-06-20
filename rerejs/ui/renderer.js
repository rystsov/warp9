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
                    var div = tk.div();
                    var i = 1;
                    if (e.length>1) {
                        if ((e[1] instanceof Array)&&(e[1][0]=="@")) {
                            var attributes = {}
                            var attr = e[1]
                            for(i=1;i<attr.length;i++) {
                                if (attr[i][0]=="#visibility") {
                                    div.visibility.follows(attr[i][1]);
                                } else if (attr[i][0]=="css") {
                                    attributes.css = {};
                                    for (var j=1;j<attr[i].length;j++) {
                                        attributes.css[attr[i][j][0]] = attr[i][j][1];
                                    }
                                } else {
                                    attributes[attr[i][0]]=attr[i][1];
                                }
                            }
                            div.attributes(attributes);
                            i=2;
                        }
                    }
                    var content = [];
                    for(;i<e.length;i++) {
                        content.push(flow(e[i]));
                    }
                    div.content(content);
                    return div.get();
                } else if (e[0]=="span") {
                    var div = tk.span();
                    var i = 1;
                    if (e.length>1) {
                        if ((e[1] instanceof Array)&&(e[1][0]=="@")) {
                            var attributes = {}
                            var attr = e[1]
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
                            div.attributes(attributes);
                            i=2;
                        }
                    }
                    var content = [];
                    for(;i<e.length;i++) {
                        if (typeof e[i] == 'string' || e[i] instanceof String) {
                            content.push(tk.text(e[i]));
                        } else {
                            content.push(flow(e[i]));
                        }
                    }
                    div.content(content);
                    return div.get();
                } else if (e[0]=="combobox") {
                    return tk.combobox().of(e[1]).default(e[2]).get();
                } else {
                    throw new Error();
                }
            } else if (e["_is_html_element"]) {
                return lift(e.element);
            } else {
                return e;
            }
        }

        renderer.render(flow(element)).bindto(new Container(canvas));
    }
};

};
});
