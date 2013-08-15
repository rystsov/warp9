define([], function(){
return function(rere) {

var renderer = {
    h: function(element) { return new H(element); },
    tags: {
        "div": tag("div"),
        "input-text": inputText
    },
    parse: function(element) {
        var Cell = rere.reactive.Cell;

        if (typeof element==="string" || element instanceof String) {
            return new rere.ui.HtmlTextNode(element);
        }
        if (element instanceof Array) {
            if (element.length==0) throw new Error();
            var tag = element[0];
            if (!(tag in this.tags)) throw new Error("Unknown tag: " + tag);
            return this.tags[tag](element.slice(1));
        }
        if (typeof element==="object" && element.type==Cell) {
            return element.lift(this.parse.bind(this));
        }

        throw new Error();
    },
    render : function(canvas, element) {
        var Container = rere.ui.elements.Container;

        rere.ui.HtmlDom.wrap(this.parse(element)).bindto(new Container(canvas));
    }
};

return renderer;

function H(element) {
    this.element = element
}

function tag(tagName) {
    return function(args) {
        var args = parseTagArgs(args);
        var element = new rere.ui.HtmlElement(tagName);
        setAttrEvents(element, args.attr);
        element.children = [];
        for (var i in args.children) {
            var child = args.children[i];
            child = rere.ui.renderer.parse(child);
            element.children.push(child);
        }
        return element;
    };
}

function inputText(args) {
    var Cell = rere.reactive.Cell;
    args = parseTagArgs(args);
    if (args.children.length != 1) throw new Error();
    var value = args.children[0];
    if (!(typeof value==="object" && value.type==Cell)) throw new Error();

    var element = new rere.ui.HtmlElement("input");
    setAttrEvents(element, args.attr);
    element.attributes.type = "text";
    element.attributes.value = value;
    var input = "input" in element.events ? element.events.input : function(){};
    element.events.input = function(control, view) {
        input.apply(element.events, [control, view]);
        value.set(view.value);
    };

    return element;
}

function parseTagArgs(args) {
    var Cell = rere.reactive.Cell;
    if (args.length==0) throw new Error();

    var children = [args[0]];
    var attr = null;

    while(true) {
        if (typeof args[0]==="string" || args[0] instanceof Array) break;
        if (args[0] instanceof Array) break;
        if (args[0] instanceof Object && args[0].type==Cell) break;
        if (args[0] instanceof H) break;
        children = [];
        attr = args[0];
        break;
    }

    for (var i=1;i<args.length;i++) {
        children.push(args[i]);
    }

    if (children.length==1) {
        if (children[0] instanceof H) {
            children = children[0].element;
        }
    }

    return {attr: attr, children: children};
}

function setAttrEvents(element, attr) {
    if (attr!=null) {
        for (var name in attr) {
            if (typeof attr[name]==="function") {
                element.events[name] = attr[name];
                continue;
            }
            element.attributes[name] = attr[name];
        }
    }
}

};
});
