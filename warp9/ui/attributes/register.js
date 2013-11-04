expose(new Register());

function Register() {
    this._tags = {};
    this._common = {};
    this._fallback = null;

    this._interceptors = {
        tags: {},
        common: []
    };
}

Register.prototype.findAttributeInterceptors = function(tagName) {
    if (this._interceptors.tags.hasOwnProperty(tagName)) {
        return this._interceptors.tags[tagName].concat(this._interceptors.common);
    }
    return this._interceptors.common;
};

Register.prototype.registerAttributeInterceptor = function(tagName, interceptor) {
    if (tagName === "*") {
        this._interceptors.common.push(interceptor);
    } else {
        if (!this._interceptors.tags.hasOwnProperty(tagName)) {
            this._interceptors.tags[tagName] = [];
        }
        this._interceptors.tags[tagName].push(interceptor);
    }
};


// may return null
Register.prototype.findAttributeSetter = function(tagName, attributeName) {
    while(true){
        if (!this._tags.hasOwnProperty(tagName)) break;
        if (!this._tags[tagName].hasOwnProperty(attributeName)) break;
        return this._tags[tagName][attributeName];
    }
    if (this._common.hasOwnProperty(attributeName)) {
        return this._common[attributeName];
    }
    return this._fallback;
};

Register.prototype.registerAttributeSetter = function(tagName, attributeName, setter) {
    if (tagName === "*") {
        if (attributeName === "*") {
            if (this._fallback != null) {
                return false;
            }
            this._fallback = setter;
        } else {
            if (this._common.hasOwnProperty(attributeName)) {
                return false;
            }
            this._common[attributeName] = setter;
        }
    } else {
        if (!this._tags.hasOwnProperty(tagName)) {
            this._tags[tagName] = {};
        }
        if (this._tags[tagName].hasOwnProperty(attributeName)) {
            return false;
        }
        this._tags[tagName][attributeName] = setter;
    }
    return true;
};
