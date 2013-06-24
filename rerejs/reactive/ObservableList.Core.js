define([], function() {
return function(rere) {

var ObservableList = function(data) {
    var Variable = rere.reactive.Variable;
    var ReduceTree = rere.reactive.ReduceTree;

    var self = this;
    this.id = 0;
    this["handlers"] = [];
    this["handlers/id"] = 0;
    this["rere/reactive/ObservableList"] = true;
    this.list = new Variable();

    this.getData = function() {
        return this.data;
    };
    this.values = function() {
        return this.data.map(function(e){return e.value;});
    };
    this.setData = function(data) {
        this.data = data.map(function(item){
            return {
                key: self.id++,
                value: item
            }
        });
        for (var i in this.handlers) {
            this.handlers[i].f([
                "data", 
                this.data.map(function(x){return x})
            ]);
        }
        this.list.set(this.data);
    };
    
    this.setData(data);
    this.remove = function(key) {
        var data = [];
        for (var i=0;i<this.data.length;i++){
            if (this.data[i].key==key) continue;
            data.push(this.data[i]);
        }
        this.data = data;
        for (var i in this.handlers) {
            this.handlers[i].f(["remove", key]);
        }
        this.list.set(this.data)
    };
    this.add = function(f) {
        if (typeof(f) != "function") throw new Error();
        var key = self.id++;
        var e = {key: key, value: f(key)};
        this.data.push(e);
        for (var i in this.handlers) {
            this.handlers[i].f(["add", e]);
        }
        this.list.set(this.data)
    };
    this.addValue = function(value) {
        var key = null;
        this.add(function(k){
            key = k;
            return value;
        });
        return key;
    };
    this.addKeyValue = function(key, value) {
        var e = {key: key, value: value};
        this.data.push(e);
        for (var i in this.handlers) {
            this.handlers[i].f(["add", e]);
        }
        this.list.set(this.data)
    };

    this.lift = function(f) {
        var nova = new ObservableList([]);
        this.subscribe(ObservableList.handler({
            data: function(e) { nova.setData(e.map(f)); },
            add: function(e) { nova.addKeyValue(e.key, f(e.value)); },
            remove: function(e) { nova.remove(e); }
        }));
        return nova;
    };

    this.subscribe = function(f) {
        var id = this["handlers/id"];
        this["handlers/id"]++;
        this["handlers"].push({key: id, f:f});
        f([
            "data", 
            this.data.map(function(x){return x})
        ]);
        return function() {
            self["handlers"] = self["handlers"].filter(function(handler) {
                return handler.key!=id;
            });
        }
    };

    this.reduceCA = function(f) {
        var args = arguments;
        var head = new Variable();
        var result = head.bind(function(x) { return x; });
        var tree = null;
        this.subscribe(ObservableList.handler({
            data: function(e) {
                head.unset();
                tree = args.length==1 ? new ReduceTree(f) : new ReduceTree(f, args[1]);
                for (var i in e) {
                    tree.add(e[i].key, e[i].value);
                }
                head.set(tree.head);
            },
            add: function(e) { return tree.add(e.key, e.value); },
            remove: function(e) { tree.remove(e); }
        }));
        return result;
    };
};

ObservableList.handler = function(handlers) {
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

return ObservableList;

};
});
