define([], function() {
return function(rere) {

return function(renderer) {
    renderer.addPithyTag("div");
    renderer.addPithyTag("span");
    renderer.addPithyTag("label");
    renderer.addPithyTag("button");
    renderer.addPithyTag("form");
    renderer.addPithyTag("ul");
    renderer.addPithyTag("li");
    renderer.addPithyTag("table");
    renderer.addPithyTag("tr");
    renderer.addPithyTag("td");
    renderer.addPithyTag("a");
    renderer.addPithyTag("section");
    renderer.addPithyTag("header");
    renderer.addPithyTag("footer");
    renderer.addPithyTag("h1");
    renderer.addPithyTag("strong");
    renderer.addPithyTag("option");
    renderer.addPithyTag("sup");
    renderer.addPithyTag("sub");

    renderer.addVoidTag("input-radio", function(state) { return new InputCheck(state, "radio"); })
    renderer.addVoidTag("input-check", function(state) { return new InputCheck(state, "checkbox"); })
    renderer.addVoidTag("input-text", function(state) { return new InputText(state); })
    renderer.addPithyTag("combobox", function(state) { return new ComboBox(state); })

    renderer.addTag("text", null, function(info) {
        if (typeof info.casual[0] == 'string' || info.casual[0] instanceof String) {
            return new rere.ui.Text(info.casual[0]);
        } else {
            return renderer.parse(renderer.h(info.casual[0].lift(function(text){
                return renderer.h(new rere.ui.Text(text));
            })));
        }
    });

    return renderer;

    function InputCheck(state, type) {
        if (!type) {
            throw new Error("type must be provider");
        }
        if (!(type in {checkbox: 0, radio: 0})) throw new Error("type must be checkbox or radio")
        rere.ui.Input.apply(this, []);
        state = state || new Variable();

        this.get = function() {
            var self = this;
            this.data.attributes.type=type;
            this.data.attributes.checked = state.coalesce(false);
            var isViewOnly = this.data.attributes["rere:role"]==="view";
            var change = this.data.events.change || function(){};
            var checked = this.data.events["rere:checked"] || function(){};
            var unchecked = this.data.events["rere:unchecked"] || function(){};
            var changed = this.data.events["rere:changed"] || function(){};
            delete this.data.events["rere:checked"];
            delete this.data.events["rere:unchecked"];
            this.data.events.change = function(control, view) {
                change.apply(self.data.events, [control, view]);
                if (view.checked) {
                    checked();
                } else {
                    unchecked();
                }
                changed(view.checked);
                if (!isViewOnly) {
                    state.set(view.checked);
                }
            };

            return this;
        }
    }

    function InputText(state) {
        rere.ui.Input.apply(this, []);

        this.get = function() {
            var self = this;
            this.data.attributes.type="text";
            this.data.attributes.value = state;
            var input = "input" in this.data.events ? this.data.events.input : function(){};
            this.data.events.input = function(control, view) {
                input.apply(self.data.events, [control, view]);
                state.set(view.value);
            };

            return this;
        }
    }

    function ComboBox(state) {
        rere.ui.Element.ctor.apply(this);

        this.get = function() {
            var self = this;
            this.data.attributes.value = state;
            var change = "change" in this.data.events ? this.data.events.change : function(){};
            this.data.events.change = function(control, view) {
                change.apply(self.data.events, [control, view]);
                state.set(view.value);
            };
            return this;
        };

        this.view = function(element){
            return rere.ui.Element.renderContainer(element, document.createElement("select"));
        };
    }
}

};
});
