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
            var e = null;
            if (typeof(f) == "function") {
                var key = self.id++;
                e = {key: key, value: f(key)};
            } else {
                e = f;
            }
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
                    nova.add({key:e[1].key, value:f(e[1].value)});
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
            var head = new Variable();
            var result = rv.rv.unwrap(head);
            var tree = null;
            this.subscribe(function(e){
                if (e[0]==="data") {
                    head.unset();
                    tree = new ReduceTree(f);
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

    ObservableList.tolist = {
        rv: {
            list: function(rv) {
                var list = new ObservableList([]);
                var keys = {};
                var dispose = function() {};
                rv.onEvent(function(e){
                    dispose();
                    for (var key in keys) {
                        list.remove(key);
                    }
                    keys = {};
                    dispose = function() {};
                    if (e[0]==="set") {
                        dispose = e[1].subscribe(function(e){
                            if (e[0]==="data") {
                                for (var i in e[1]) {
                                    keys[e[1][i].key] = true;
                                    list.add({key: e[1][i].key, value: e[1][i].value});
                                }
                            } else if (e[0]==="add") {
                                keys[e[1].key] = true;
                                list.add({key: e[1].key, value: e[1].value});
                            } else if (e[0]==="remove") {
                                delete keys[e[1]]
                                list.remove(e[1]);
                            } else {
                                throw new Error("Unknown event: " + e[0]);
                            }
                        });
                    }
                });
                return list;
            }
        }
    };


    ObservableList.collector = function(f) {
        var list = new ObservableList([]);
        
        var add = {};
        add.value = function(e) {
            list.add(function(key){
                return e;
            })
        };
        add.rv = function(rv) {
            var lastKey = null;
            rv.onEvent(function(e){
                if (lastKey!=null) {
                    list.remove(lastKey);
                    lastKey = null;
                }
                if (e[0]==="set") {
                    list.add(function(key){
                        lastKey = key;
                        return e[1];
                    });
                }
            });
        }
        add.rv.maybe = function(rv) {
            var lastKey = null;
            rv.onEvent(function(e){
                if (lastKey!=null) {
                    list.remove(lastKey);
                    lastKey = null;
                }
                if (e[0]==="set") {
                    if (!(e[1]._m_is_maybe)) throw new Error();
                    if (!e[1].isempty()) {
                        list.add(function(key){
                            lastKey = key;
                            return e[1].value();
                        });
                    }
                }
            });
        }

        f(add);
        return list;
    };

    return ObservableList;
});