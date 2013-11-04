expose(null, function(){
    jq = root.ui.jq;
    CelledAttributeSetter = root.ui.attributes.CelledAttributeSetter;
    DefaultAttributeSetter = root.ui.attributes.DefaultAttributeSetter;
    register = root.ui.attributes.register;

    registerDefaultAttributeSetters();
});

var jq, register, CelledAttributeSetter, DefaultAttributeSetter;


function registerDefaultAttributeSetters() {
    register.register("*", "*", new DefaultAttributeSetter());

    register.register("*", "checked", new CelledAttributeSetter({
        set: function(view, value) {
            view.checked = value;
        },
        unset: function(view) {
            view.checked = false;
        }
    }));

    register.register("*", "value", new CelledAttributeSetter({
        set: function(view, v) {
            if (view.value != v) view.value = v;
        },
        unset: function(view) {
            if (view.value != "") view.value = "";
        }
    }));

    register.register("*", "disabled", new CelledAttributeSetter({
        set: function(view, v) {
            if (v) {
                view.setAttribute("disabled", "")
            } else {
                if (view.hasAttribute("disabled")) view.removeAttribute("disabled");
            }
        },
        unset: function(view) {
            view.removeAttribute("disabled");
        }
    }));

    // TODO: adds list support for class attribute
    register.register("*", "class", new CelledAttributeSetter({
        set: function(view, v) {
            jq.removeClass(view);
            view.classList.add(v);
        },
        unset: function(view) {
            jq.removeClass(view);
        }
    }));
}
