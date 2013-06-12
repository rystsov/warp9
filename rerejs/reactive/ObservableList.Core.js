define(
    ["rere/reactive/Variable", "rere/reactive/ReduceTree", "rere/reactive/ChannelWithMemory", "rere/reactive/rv"], 
    function(Variable, ReduceTree, ChannelWithMemory, rv) {
    function ObservableList(data) {
        var self = this;
        this.id = 0;
        this["handlers"] = [];
        this["handlers/id"] = 0;
        this["rere/reactive/ObservableList"] = true;
        this.list = new ChannelWithMemory();

        this.getData = function() {
            return this.data;
        };
        this.values = function() {
            return this.data.map(function(e){return e.value;});
        }
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
            this.list.set(this.data)
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
            this.subscribe(function(e){
                if (e[0]=="data") {
                    nova.setData(e[1].map(f));
                } else if (e[0]=="add") {
                    nova.addKeyValue(e[1].key, f(e[1].value));
                } else if (e[0]=="remove") {
                    nova.remove(e[1]);
                } else {
                    throw new Error();
                }
            });
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
            var result = rv.rv.unwrap(head);
            var tree = null;
            this.subscribe(function(e){
                if (e[0]==="data") {
                    head.unset();
                    
                    if (args.length==1) {
                        tree = new ReduceTree(f);
                    } else {
                        tree = new ReduceTree(f, args[1]);
                    }
                    
                    for (var i in e[1]) {
                        tree.add(e[1][i].key, e[1][i].value);
                    }
                    head.set(tree.head);
                } else if (e[0]==="add") {
                    tree.add(e[1].key, e[1].value);
                } else if (e[0]==="remove") {
                    tree.remove(e[1]);
                } else throw new Error();
            });

            return result;
        }
    };
    
    return ObservableList;
});