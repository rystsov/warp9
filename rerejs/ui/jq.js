define([], function() {
return function(rere) {

return {
    css: function(self, property, value){
        var getComputedStyle = document.defaultView.getComputedStyle;

        if (arguments.length < 3 && typeof property == 'string') {
            return self.style[camelize(property)] || getComputedStyle(self, '').getPropertyValue(property);
        }

        if (!value && value !== 0) {
            self.style.removeProperty(dasherize(property));
            return;
        }

        self.style.cssText += ';' + dasherize(property) + ":" + value;
    },
    removeClass: function(self, name) {
        if (!name) {
            while (self.classList.length > 0) self.classList.remove(self.classList.item(0));
        } else {
            self.classList.remove(name);
        }
    },
    after: function(self, element) {
        self.parentNode.insertBefore(element, self.nextSibling);
    },
    remove: function(self) {
        try {
            self.parentNode.removeChild(self);
        } catch (e) {
            throw e;
        }
    }
};

function camelize(str){ 
    return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' });
}

function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase();
}

};
});
