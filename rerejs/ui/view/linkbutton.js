define(["rere/ui/elements/FragmentElement"], function(FragmentElement) {
    return function(){
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
	        var button = $("<span/>");
	        for (var name in mycss) {
	        	button.css(name, mycss[name]);
	        }
	        button.append(element.data.label);
	        button.click(function(){
	            element.raise();
	        });
	        return new FragmentElement(button);
	    }
	};
});
