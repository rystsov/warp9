define([], function() {
return function(rere) {

return function(renderer) {
    addPithyTag(renderer, "div", container("div"));
    addPithyTag(renderer, "span", container("span"));
    addPithyTag(renderer, "label", container("label"));
    addPithyTag(renderer, "button", container("button"));
    addPithyTag(renderer, "form", container("form"));
    addPithyTag(renderer, "ul", container("ul"));
    addPithyTag(renderer, "li", container("li"));
    addPithyTag(renderer, "a", container("a"));
    addPithyTag(renderer, "section", container("section"));
    addPithyTag(renderer, "header", container("header"));
    addPithyTag(renderer, "footer", container("footer"));
    addPithyTag(renderer, "h1", container("h1"));
    addPithyTag(renderer, "strong", container("strong"));
    addPithyTag(renderer, "option", container("option"));
    addStatefulVoidTag(renderer, "input-radio", function(state) { return new rere.ui.InputRadio(state); })
    addStatefulVoidTag(renderer, "input-check", function(state) { return new rere.ui.InputCheck(state); })
    addStatefulVoidTag(renderer, "input-text", function(state) { return new rere.ui.InputText(state); })
    addStatefulPithyTag(renderer, "combobox", function(state) { return new rere.ui.ComboBox(state); })

    renderer.addTag("text", null, function(info) {
        if (typeof info.casual[0] == 'string' || info.casual[0] instanceof String) {
            return new Text(info.casual[0]);
        } else {
            return renderer.parse(renderer.h(info.casual[0].lift(function(text){
                return renderer.h(new Text(text));
            })));
        }
    });

    return renderer;

    function addPithyTag(renderer, tag, factory) {
        renderer.addTag(tag, factory, function(info){
            var element = factory();
            if (info.attributes) element.attributes(info.attributes);
            if (info.events) element.events(info.events);

            element.content(info.casual.map(function(item){
                if (typeof item == 'string' || item instanceof String) {
                    return new Text(item)
                } else {
                    return renderer.parse(item);
                }
            }));
            return element.get();
        });
    }

    function addStatefulVoidTag(renderer, tag, factory) {
        renderer.addTag(tag, factory, function(info){
            var element = factory(info.casual[0]);
            if (info.attributes) element.attributes(info.attributes);
            if (info.events) element.events(info.events);
            return element.get();
        });
    }

    function addStatefulPithyTag(renderer, tag, factory) {
        renderer.addTag(tag, factory, function(info){
            var element = factory(info.casual[0]);
            info.casual.slice(0, 1);
            if (info.attributes) element.attributes(info.attributes);
            if (info.events) element.events(info.events);

            element.content(info.casual.map(function(item){
                if (typeof item == 'string' || item instanceof String) {
                    return new Text(item);
                } else {
                    return renderer.parse(item);
                }
            }));
            return element.get();
        });
    }

    function container(tag) {
        return function() {
            return new function() {
                rere.ui.Element.ctor.apply(this);
                this.view = function(element){
                    return rere.ui.Element.renderContainer(element, document.createElement(tag));
                };
            };
        }
    }

    function Text(text) {
        this._ui_is = true;
        this.view = function() {
            var FragmentElement = rere.ui.elements.FragmentElement;
            return new FragmentElement(document.createTextNode(text));
        }
    }
}

};
});
