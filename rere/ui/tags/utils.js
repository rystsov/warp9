expose({
    parseTagArgs: parseTagArgs,
    normalizeAttributes: normalizeAttributes,
    denormalizeAttributes: denormalizeAttributes,
    tryEnrich: tryEnrich,
    H: H
});

function H(element) {
    this.element = element
}

function parseTagArgs(args) {
    var Cell = root.reactive.Cell;
    var List = root.reactive.List;
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

    return {attr: attr, children: children};
}

function tryEnrich(target, supplement) {
    if (!supplement) return;
    for(var key in supplement) {
        if (!supplement.hasOwnProperty(key)) continue;
        if (key in target) {
            if (typeof target[key]==="object") {
                if (typeof supplement[key]!=="object") {
                    throw new Error();
                }
                tryEnrich(target[key], supplement[key]);
            } else {
                continue;
            }
        }
        target[key] = supplement[key];
    }
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

function denormalizeAttributes(attr) {
    var result = {};
    for (var attrKey in attr.attributes) {
        if (!attr.attributes.hasOwnProperty(attrKey)) continue;
        result[attrKey] = attr.attributes[attrKey];
    }
    for (var eventKey in attr.events) {
        if (!attr.events.hasOwnProperty(eventKey)) continue;
        result["!"+eventKey] = attr.events[eventKey];
    }
    return result;
}