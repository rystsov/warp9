expose({
    parse: parse,
    H: H
}, function(){
    Cell = root.reactive.Cell;
    List = root.reactive.List;
});

var Cell, List;

function H(element) {
    this.element = element
}

function parse(args) {
    if (args.length==0) throw new Error();

    var children = [args[0]];
    var attr = null;

    while(true) {
        if (typeof args[0]==="string") break;
        if (args[0] instanceof Array) break;
        if (args[0] instanceof Object && args[0].type==Cell) break;
        if (args[0] instanceof Object && args[0].type==List) break;
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

    var element = normalizeAttributes(attr);

    var onDraw = [];
    if (element.events.hasOwnProperty("warp9:draw")) {
        onDraw.push(element.events["warp9:draw"]);
        delete element.events["warp9:draw"];
    }

    return {
        events: element.events,
        onDraw: onDraw,
        attributes: element.attributes,
        children: children
    };
}



function normalizeAttributes(attr) {
    var element = {
        events: {},
        attributes: {}
    };
    if (attr!=null) {
        for (var name in attr) {
            if (!attr.hasOwnProperty(name)) continue;

            if (typeof attr[name]==="function" && name[0]==="!") {
                element.events[name.substring(1)] = attr[name];
                continue;
            }
            if (name.indexOf("css/")===0) {
                if (!element.attributes.css) {
                    element.attributes.css = {};
                }
                element.attributes.css[name.substring(4)] = attr[name];
                continue;
            }
            if (name==="css") {
                if (!element.attributes.css) {
                    element.attributes.css = {};
                }
                for (var key in attr[name]) {
                    if (!attr[name].hasOwnProperty(key)) continue;
                    element.attributes.css[key] = attr[name][key];
                }
            }
            element.attributes[name] = attr[name];
        }
    }
    return element;
}
