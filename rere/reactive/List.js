expose(List, function(){
    BaseList = root.reactive.lists.BaseList;
    Cell = root.reactive.Cell;

    SetListPrototype();
});

var BaseList, Cell;

// TODO: subscribe during add consistency

function List(data) {
    this._elementId = 0;
    BaseList.apply(this);

    this.setData(data ? data : []);
}

List.handler = function(handlers) {
    return function(e) {
        while(true) {
            if (e[0]==="data") break;
            if (e[0]==="add") break;
            if (e[0]==="remove") break;
            throw new Error();
        }
        handlers[e[0]].call(handlers, e[1]);
    };
};

function SetListPrototype() {
    List.prototype = new BaseList();

    List.prototype.use = function(id) {
        BaseList.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.raise(["data", this.data.slice()]);
        }
    };

    List.prototype.setData = function(data) {
        this.data = data.map(function(item){
            return {
                key: this._elementId++,
                value: item
            }
        }.bind(this));
        this.raise(["data", this.data.slice()]);
    };

    List.prototype.unwrap = function() {
        return this.data.map(function(item){
            return item.value;
        });
    };

    List.prototype.add = function(f) {
        if (typeof(f) != "function") {
            var item = f;
            f = function(id) { return item; };
        }
        var key = this._elementId++;
        var e = {key: key, value: f(key)};
        this.data.push(e);
        this.raise(["add", e]);
        return key;
    };

    List.prototype.remove = function(key) {
        var removed = false;
        var length = this.data.length;
        this.data = this.data.filter(function(item){
            return item.key != key;
        });
        if (length!=this.data.length) {
            removed = true;
        }
        this.raise(["remove", key]);
        return removed;
    };

    List.prototype.removeWhich = function(f) {
        this.data.filter(function(item) {
            return f(item.value);
        }).forEach(function(item){
            this.remove(item.key);
        }.bind(this));
    };

    List.prototype.forEach = function(callback) {
        for(var i=0;i<this.data.length;i++) {
            callback(this.data[i].value);
        }
    };
}
