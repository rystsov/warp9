define([], function() {
return function(rere) {

return function(){
    var jq = rere.ui.jq;
    var FragmentElement = rere.ui.elements.FragmentElement;

    var css = {};
    if (arguments.length==1) {
        css = arguments[0]
    }
    return function(element) {
        var mycss = {
            "cursor": "pointer",
            "text-decoration": "underline",
            "color": "blue"
        }
        for (var name in css) {
            mycss[name] = css[name]
        }
        
        var button = document.createElement("span");
        button.appendChild(document.createTextNode(element.data.label));
        for (var name in mycss) {
            jq.css(button, name, mycss[name]);
        }
        button.addEventListener("click", function() {
            element.raise();
        }, false);
        return new FragmentElement(button);
    }
};

};
});
