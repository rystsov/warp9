define([], function() {
    return function(name) {
        var hello = name.when(
            function(name) { return name.length > 0; },
            function(name) { return "Hello, " + name + "!"; }
        );
        return ["div",
            ["div",
                ["input-text", {
                    "css/background": hello.isSet().when(false, "red")
                }, name],
                ["button", {"!click": function() {
                    name.unset();
                }}, "clear"]],
            hello.lift(function(hello) {
                return ["div", hello];
            })
        ];
    };
});