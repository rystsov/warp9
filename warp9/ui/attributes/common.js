expose(null, function(){
    jq = root.ui.jq;
    CelledAttributeSetter = root.ui.attributes.CelledAttributeSetter;
    DefaultAttributeSetter = root.ui.attributes.DefaultAttributeSetter;
    register = root.ui.attributes.register;

    registerDefaultInterceptors();
    registerDefaultAttributeSetters();
});

var jq, register, CelledAttributeSetter, DefaultAttributeSetter;

function registerDefaultInterceptors() {
    register.registerAttributeInterceptor("input-text", function(tag, args) {
        if (!args.events.hasOwnProperty("key:enter")) {
            return args;
        }
        var keypress = null;
        if (args.events.hasOwnProperty("keypress")) {
            keypress = args.events["keypress"];
        }
        var enter = args.events["key:enter"];
        args.events["keypress"] = function (element, view, event) {
            if (keypress!=null) {
                keypress(element, view, event);
            }
            if (event.keyCode == 13) {
                enter(element, view, event);
            }
        };
        delete args.events["key:enter"];
        return args;
    });
}

function registerDefaultAttributeSetters() {
    register.registerAttributeSetter("*", "*", new DefaultAttributeSetter());

    register.registerAttributeSetter("*", "checked", new CelledAttributeSetter({
        set: function(view, value) {
            view.checked = value;
        },
        unset: function(view) {
            view.checked = false;
        }
    }));

    register.registerAttributeSetter("*", "value", new CelledAttributeSetter({
        set: function(view, v) {
            if (view.value != v) view.value = v;
        },
        unset: function(view) {
            if (view.value != "") view.value = "";
        }
    }));

    register.registerAttributeSetter("*", "disabled", new CelledAttributeSetter({
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
    register.registerAttributeSetter("*", "class", new CelledAttributeSetter({
        set: function(view, v) {
            jq.removeClass(view);
            view.classList.add(v);
        },
        unset: function(view) {
            jq.removeClass(view);
        }
    }));
}
