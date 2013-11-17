define([], function() {
    var warp9 = (function(){
        return (function(){
            var files = data.apply(null);
            var library = {};
            Object.keys(files).forEach(function(i){
                initModuleStructure(library, library, files[i].path, files[i].content);
            });
            var ctors = [];
            Object.keys(files).forEach(function(i){
                addModuleContentCollectCtor(library, library, files[i].path, files[i].content, ctors);
            });
            ctors.forEach(function(x){ x(); });
            return library;
            
            function initModuleStructure(library, namespace, path, content) {
                if (path.length==0) throw new Error();
                if (path.length>1) {
                    var name = path[0];
                    if (!(name in namespace)) {
                        namespace[name] = {};
                    }
                    initModuleStructure(library, namespace[name], path.slice(1), content);
                }
                if (path.length==1) {
                    var exposed = null;
                    try {
                        content.apply(null, [library, function(obj) {
                            exposed = obj;
                            throw new ExposeBreak();
                        }]);
                    } catch (e) {
                        if (!(e instanceof ExposeBreak)) {
                            throw new Error(e);
                        }
                    }
                    if (exposed!=null) {
                        if (typeof exposed==="object") {
                            namespace[path[0]] = {};
                        }
                    }
                }
                function ExposeBreak() {}
            }
            function addModuleContentCollectCtor(library, namespace, path, content, ctors) {
                if (path.length>1) {
                    addModuleContentCollectCtor(library, namespace[path[0]], path.slice(1), content, ctors);
                }
                if (path.length==1) {
                    content.apply(null, [library, function(obj, ctor) {
                        if (ctor) ctors.push(ctor);
                        namespace[path[0]] = obj;
                    }]);
                }
            }
        })();
        function data(data, hack) {
            if (data || hack) {
                // removes unused parameter warning
            }
            return [
                {
                    path: ["adt","Set"],
                    content: function(root, expose) {
                        expose(Set);
                        
                        function Set() {
                            this.length = 0;
                            this._items = [];
                        }
                        
                        Set.prototype.push = function(item) {
                            if (this._items.indexOf(item)>=0) return;
                            this._items.push(item);
                            this.length++;
                        };
                        
                        Set.prototype.toList = function() {
                            return this._items.map(function(item){ return item; });
                        };
                        
                    }
                },
                {
                    path: ["adt","SortedList"],
                    content: function(root, expose) {
                        expose(SortedList);
                        
                        // TODO: rewrite to SortedSet
                        function SortedList(comparator) {
                            // TODO: implement http://en.wikipedia.org/wiki/Treap
                            this.length = 0;
                            this.comparator = comparator;
                            this._items = [];
                        }
                        
                        SortedList.prototype.push = function(item) {
                            this._items.push(item);
                            this.length++;
                        };
                        
                        SortedList.prototype.pop = function(item) {
                            if (this.length==0) {
                                throw new Error();
                            }
                            this._items = this._items.sort(this.comparator);
                            this.length--;
                            return this._items.shift();
                        };
                        
                    }
                },
                {
                    path: ["adt","maybe"],
                    content: function(root, expose) {
                        expose({
                            Some: Some,
                            None: None
                        });
                        
                        function Some(value) {
                            this.value = function() {
                                return value;
                            };
                            this.isEmpty = function() {
                                return false;
                            };
                            this.lift = function(f) {
                                return new Some(f(value));
                            };
                            this.isEqualTo = function(brother) {
                                if (brother==null) return false;
                                return !brother.isEmpty() && brother.value() === value;
                            };
                            this.unwrap = function() {
                                return value;
                            };
                        }
                        
                        function None() {
                            this.value = function() {
                                throw new Error();
                            };
                            this.isEmpty = function() {
                                return true;
                            };
                            this.lift = function() {
                                return this;
                            };
                            this.isEqualTo = function(brother) {
                                if (brother==null) return false;
                                return brother.isEmpty();
                            };
                            this.unwrap = function(alt) {
                                if (arguments.length==0) {
                                    throw new Error();
                                }
                                return alt;
                            };
                        }
                        
                    }
                },
                {
                    path: ["idgenerator"],
                    content: function(root, expose) {
                        expose(idgenerator);
                        
                        var id = 0;
                        
                        function idgenerator() {
                            return id++;
                        }
                    }
                },
                {
                    path: ["reactive","Cell"],
                    content: function(root, expose) {
                        expose(Cell, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            BaseCell = root.reactive.cells.BaseCell;
                        
                            SetCellPrototype();
                        });
                        
                        
                        // pull by default (unwrap)
                        // subscribe (onEvent) doesn't activate (switch to push) cell
                        
                        var Some, None, BaseCell;
                        
                        function Cell() {
                            BaseCell.apply(this, []);
                        
                            if (arguments.length>0) {
                                this.content = new Some(arguments[0]);
                            } else {
                                this.content = new None();
                            }
                        }
                        
                        function SetCellPrototype() {
                            Cell.prototype = new BaseCell();
                        
                            Cell.prototype.unwrap = function(alt) {
                                if (arguments.length==0 && this.content.isEmpty()) {
                                    throw new Error();
                                }
                                return this.content.isEmpty() ? alt : this.content.value();
                            };
                        
                            // Specific
                            Cell.prototype.set = function(value) {
                                root.reactive.event_broker.issue(this, {
                                    name: "set",
                                    value: value
                                });
                            };
                        
                            Cell.prototype.unset = function() {
                                root.reactive.event_broker.issue(this, {
                                    name: "unset"
                                });
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                set: "_set",
                                unset: "_unset"
                            };
                        
                            Cell.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseCell.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            Cell.prototype._leak = function(event) {
                                BaseCell.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.__raise();
                                }
                            };
                        
                            Cell.prototype._set = function(event) {
                                if (event.name!="set") throw new Error();
                                if (!this.content.isEmpty() && this.content.value()===event.value) return;
                                this.content = new Some(event.value);
                                this.__raise();
                            };
                        
                            Cell.prototype._unset = function(event) {
                                if (event.name!="unset") throw new Error();
                                if (this.content.isEmpty()) return;
                                this.content = new None();
                                this.__raise();
                            };
                        }
                        
                        Cell.handler = function(handler) {
                            return function(e) {
                                if (e[0]==="set") {
                                    handler.set(e[1]);
                                } else if (e[0]==="unset") {
                                    handler.unset();
                                } else {
                                    throw new Error("Unknown event: " + e[0]);
                                }
                            };
                        };
                        
                        Cell.instanceof = function(obj) {
                            return typeof obj==="object" && obj.type == Cell;
                        };
                        
                    }
                },
                {
                    path: ["reactive","List"],
                    content: function(root, expose) {
                        expose(List, function(){
                            BaseList = root.reactive.lists.BaseList;
                            Cell = root.reactive.Cell;
                        
                            SetListPrototype();
                        });
                        
                        var BaseList, Cell;
                        
                        function List(data) {
                            this._elementId = 0;
                            BaseList.apply(this);
                        
                            this.setData(data ? data : []);
                        }
                        
                        function SetListPrototype() {
                            List.prototype = new BaseList();
                        
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
                        
                                var event = {
                                    name: "add",
                                    key: this._elementId++,
                                    f: f
                                };
                        
                                root.reactive.event_broker.issue(this, event);
                        
                                return event.key;
                            };
                        
                            List.prototype.setData = function(data) {
                                root.reactive.event_broker.issue(this, {
                                    name: "setData",
                                    data: data
                                });
                            };
                        
                            List.prototype.remove = function(key) {
                                root.reactive.event_broker.issue(this, {
                                    name: "remove",
                                    key: key
                                });
                            };
                        
                            List.prototype.forEach = function(callback) {
                                root.reactive.event_broker.issue(this, {
                                    name: "forEach",
                                    callback: callback
                                });
                            };
                        
                            List.prototype.removeWhich = function(f) {
                                root.reactive.event_broker.issue(this, {
                                    name: "removeWhich",
                                    f: f
                                });
                            };
                        
                            var knownEvents = {
                                add: "_add",
                                setData: "_setData",
                                remove: "_remove",
                                forEach: "_forEach",
                                removeWhich: "_removeWhich",
                                leak: "_leak"
                            };
                        
                            List.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseList.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            List.prototype._add = function(event) {
                                if (event.name != "add") throw new Error();
                                var e = {key: event.key, value: event.f(event.key)};
                                this.data.push(e);
                                this.__raise(["add", e]);
                            };
                        
                            List.prototype._setData = function(event) {
                                if (event.name != "setData") throw new Error();
                                this.data = event.data.map(function(item){
                                    return {
                                        key: this._elementId++,
                                        value: item
                                    }
                                }.bind(this));
                                this.__raise(["data", this.data.slice()]);
                            };
                        
                            List.prototype._remove = function(event) {
                                if (event.name != "remove") throw new Error();
                                var length = this.data.length;
                                this.data = this.data.filter(function(item){
                                    return item.key != event.key;
                                });
                                if (length!=this.data.length) {
                                    this.__raise(["remove", event.key]);
                                }
                            };
                        
                            List.prototype._forEach = function(event) {
                                if (event.name != "forEach") throw new Error();
                                for(var i=0;i<this.data.length;i++) {
                                    event.callback(this.data[i].value);
                                }
                            };
                        
                            List.prototype._removeWhich = function(event) {
                                if (event.name != "removeWhich") throw new Error();
                                this.data.filter(function(item) {
                                    return event.f(item.value);
                                }).forEach(function(item){
                                    this.remove(item.key);
                                }.bind(this));
                            };
                        
                            List.prototype._leak = function(event) {
                                BaseList.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.__raise(["data", this.data.slice()]);
                                }
                            };
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
                        
                        List.instanceof = function(obj) {
                            return typeof obj==="object" && obj.type == List;
                        };
                    }
                },
                {
                    path: ["reactive","algebra","GroupReducer"],
                    content: function(root, expose) {
                        expose(Sigma, function() {
                            Cell = root.reactive.Cell;
                        });
                        
                        var Cell;
                        
                        function Sigma(id, group, wrap, ignoreUnset, callback) {
                            this.id = id;
                            this.wrap = wrap;
                            this.ignoreUnset = ignoreUnset;
                            this.group = group;
                            this.callback = callback;
                        
                            this.sum = group.identity();
                            this.isActive = true;
                            this.known = {};
                            this.inited = false;
                            this.blocks = 0;
                            this.reports = 0;
                            this.count = 0;
                        }
                        
                        Sigma.prototype.init = function(data) {
                            if (this.inited) throw new Error();
                            this.inited = true;
                            this.count = data.length;
                            data.forEach(function(item){
                                this._add(item.key, item.value);
                            }.bind(this));
                            if (data.length==0) {
                                this.callback(["set", this.sum]);
                            }
                        };
                        
                        Sigma.prototype.add = function(key, value) {
                            this.count++;
                            this._add(key, value);
                        };
                        
                        Sigma.prototype._add = function(key, value) {
                            var self = this;
                        
                            if (!(typeof value === "object" && value.type === Cell)) {
                                value = new Cell(value);
                            }
                            var isActive = true;
                            var isBlocked = false;
                            var isReported = false;
                            var last = null;
                        
                            value.leak(self.id);
                            var dispose = value.onEvent(function(e) {
                                if (!isActive || !self.isActive) return;
                                if (!isReported) {
                                    self.reports++;
                                    isReported = true;
                                }
                                if (e[0] === "set") {
                                    set(e[1]);
                                } else if (e[0] === "unset") {
                                    unset();
                                } else {
                                    throw new Error();
                                }
                            });
                        
                            self.known[key] = function() {
                                if (!isActive) return;
                                // TODO: remove (key, last)
                                if (last != null) {
                                    self.sum = self.group.add(self.sum, self.group.invert(last.value));
                                    last = null;
                                }
                                //////////////////////
                                isActive = false;
                                dispose();
                                value.seal(self.id);
                                if (isBlocked) {
                                    isBlocked = false;
                                    self.blocks--;
                                }
                                self.count--;
                                self.reports--;
                            };
                        
                            function set(x) {
                                if (isBlocked) {
                                    isBlocked = false;
                                    self.blocks--;
                                }
                                // TODO: upsert (key, x)
                                if (last != null) {
                                    self.sum = self.group.add(self.sum, self.group.invert(last.value));
                                }
                                last = {
                                    value: self.wrap(x)
                                };
                                self.sum = self.group.add(self.sum, last.value);
                                ///////////////////////
                                self.raise();
                            }
                        
                            function unset() {
                                if (isBlocked) return;
                                isBlocked = true;
                                self.blocks++;
                                // TODO: upsert (key, last, identity)
                                if (last != null) {
                                    self.sum = self.group.add(self.sum, self.group.invert(last.value));
                                }
                                last = null;
                                ///////////////////////
                                if (self.blocks==1) {
                                    self.raise();
                                }
                            }
                        };
                        
                        Sigma.prototype.raise = function() {
                            if (this.count != this.reports) return;
                            if (!this.ignoreUnset && this.blocks>0) {
                                this.callback(["unset"]);
                                return;
                            }
                            this.callback(["set", this.sum]);
                        };
                        
                        Sigma.prototype.remove = function(key) {
                            if (!this.known.hasOwnProperty(key)) {
                                throw new Error("Unknown key: " + key);
                            }
                            this.known[key]();
                            delete this.known[key];
                            this.raise();
                        };
                        
                        Sigma.prototype.dispose = function() {
                            this.isActive = false;
                            var keys = [];
                            for (var key in this.known) {
                                if (!this.known.hasOwnProperty(key)) continue;
                                this.known[key]();
                                keys.push(key);
                            }
                            keys.forEach(function(key) { delete this.known[key] }.bind(this));
                        };
                    }
                },
                {
                    path: ["reactive","algebra","MonoidReducer"],
                    content: function(root, expose) {
                        expose(ReduceTree, function(){
                            Cell = root.reactive.Cell;
                            MonoidTree = root.reactive.algebra.MonoidTree;
                        });
                        
                        var Cell, MonoidTree, Reducer;
                        
                        function ReduceTree(id, monoid, wrap, ignoreUnset, callback) {
                            this.id = id;
                            this.wrap = wrap;
                            this.ignoreUnset = ignoreUnset;
                            this.monoid = monoid;
                            this.callback = callback;
                        
                            this.root = null;
                            this.keyToIndex = {};
                            this.indexToKey = [];
                            this.isActive = true;
                            this.known = {};
                            this.inited = false;
                            this.blocks = 0;
                            this.reports = 0;
                            this.count = 0;
                        }
                        
                        ReduceTree.prototype.init = function(data) {
                            if (this.inited) throw new Error();
                            this.inited = true;
                            this.count = data.length;
                            data.forEach(function(item){
                                this._add(item.key, item.value);
                            }.bind(this));
                            if (data.length==0) {
                                this.callback(["set", this.monoid.identity()]);
                            }
                        };
                        
                        ReduceTree.prototype.add = function(key, value) {
                            this.count++;
                            this._add(key, value);
                        };
                        
                        ReduceTree.prototype._add = function(key, value) {
                            var self = this;
                        
                            if (!(typeof value === "object" && value.type === Cell)) {
                                value = new Cell(value);
                            }
                            var isActive = true;
                            var isBlocked = false;
                            var isReported = false;
                            //var last = null;
                        
                            value.leak(self.id);
                            var dispose = value.onEvent(function(e) {
                                if (!isActive || !self.isActive) return;
                                if (!isReported) {
                                    self.reports++;
                                    isReported = true;
                                }
                                if (e[0] === "set") {
                                    set(e[1]);
                                } else if (e[0] === "unset") {
                                    unset();
                                } else {
                                    throw new Error();
                                }
                            });
                        
                            self.known[key] = function() {
                                if (!isActive) return;
                                removeNode(self, key);
                                isActive = false;
                                dispose();
                                value.seal(self.id);
                                if (isBlocked) {
                                    isBlocked = false;
                                    self.blocks--;
                                }
                                self.count--;
                                self.reports--;
                            };
                        
                            function set(x) {
                                if (isBlocked) {
                                    isBlocked = false;
                                    self.blocks--;
                                }
                                upsertNode(self, key, self.wrap(x));
                                self.raise();
                            }
                        
                            function unset() {
                                if (isBlocked) return;
                                isBlocked = true;
                                self.blocks++;
                                upsertNode(self, key, self.monoid.identity());
                                if (self.blocks==1) {
                                    self.raise();
                                }
                            }
                        };
                        
                        ReduceTree.prototype.raise = function() {
                            if (this.count != this.reports) return;
                            if (!this.ignoreUnset && this.blocks>0) {
                                this.callback(["unset"]);
                                return;
                            }
                            this.callback(["set", this.root == null ? this.monoid.identity() : this.root.value]);
                        };
                        
                        ReduceTree.prototype.remove = function(key) {
                            if (!this.known.hasOwnProperty(key)) {
                                throw new Error("Unknown key: " + key);
                            }
                            this.known[key]();
                            delete this.known[key];
                            this.raise();
                        };
                        
                        ReduceTree.prototype.dispose = function() {
                            this.isActive = false;
                            var keys = [];
                            for (var key in this.known) {
                                if (!this.known.hasOwnProperty(key)) continue;
                                this.known[key]();
                                keys.push(key);
                            }
                            keys.forEach(function(key) { delete this.known[key] }.bind(this));
                        };
                        
                        
                        
                        
                        function upsertNode(tree, key, value) {
                            if (tree.keyToIndex.hasOwnProperty(key)) {
                                tree.root = tree.root.change(tree.monoid, tree.keyToIndex[key], value);
                            } else {
                                tree.keyToIndex[key] = s(tree.root);
                                tree.indexToKey.push(key);
                                tree.root = tree.root==null ? MonoidTree.leaf(value) : tree.root.put(tree.monoid, value);
                                assert(s(tree.root) == tree.indexToKey.length);
                            }
                        }
                        
                        function removeNode(tree, key) {
                            if (!tree.keyToIndex.hasOwnProperty(key)) return;
                            if (tree.keyToIndex[key]+1 !== tree.indexToKey.length) {
                                tree.root = tree.root.change(tree.monoid, tree.keyToIndex[key], tree.root.peek());
                                var lastKey = tree.indexToKey.pop();
                                tree.indexToKey[tree.keyToIndex[key]] = lastKey;
                                tree.keyToIndex[lastKey] = tree.keyToIndex[key];
                            } else {
                                tree.indexToKey.pop();
                            }
                            tree.root = tree.root.pop(tree.monoid);
                            delete tree.keyToIndex[key];
                        }
                        
                        function s(node) {
                            return node==null ? 0 : node.size;
                        }
                        
                        function assert(value) {
                            if (!value) throw new Error();
                        }
                        
                    }
                },
                {
                    path: ["reactive","algebra","MonoidTree"],
                    content: function(root, expose) {
                        expose(MonoidTree);
                        
                        function MonoidTree(value, size, left, right) {
                            this.value = value;
                            this.size = size;
                            this.left = left;
                            this.right = right;
                        }
                        MonoidTree.leaf = function(value) {
                            return new MonoidTree(value, 1, null, null);
                        };
                        MonoidTree.of = function(monoid, left, right) {
                            return new MonoidTree(monoid.add(left.value, right.value), left.size + right.size, left, right);
                        };
                        
                        MonoidTree.prototype.change = function(monoid, index, value) {
                            if (index === 0 && this.size === 1) {
                                return MonoidTree.leaf(value);
                            }
                            if (index < this.left.size) {
                                return MonoidTree.of(monoid, this.left.change(monoid, index, value), this.right);
                            } else {
                                return MonoidTree.of(monoid, this.left, this.right.change(monoid, index - this.left.size, value));
                            }
                        };
                        
                        MonoidTree.prototype.peek = function() {
                            return this.size === 1 ? this.value : this.right.peek();
                        };
                        
                        MonoidTree.prototype.put = function(monoid, value) {
                            assert (s(this.left)>=s(this.right));
                            var left, right;
                            if (s(this.left)==s(this.right)) {
                                left = this;
                                right = MonoidTree.leaf(value);
                            } else {
                                left = this.left;
                                right = this.right.put(monoid, value);
                            }
                            return MonoidTree.of(monoid, left, right);
                        };
                        
                        MonoidTree.prototype.pop = function(monoid) {
                            if (this.size==1) return null;
                            assert (this.right!=null);
                            assert (this.left!=null);
                            var right = this.right.pop(monoid);
                            if (right==null) {
                                return this.left;
                            } else {
                                return MonoidTree.of(monoid, this.left, right);
                            }
                        };
                        
                        function s(node) {
                            return node==null ? 0 : node.size;
                        }
                        
                        function assert(value) {
                            if (!value) throw new Error();
                        }
                    }
                },
                {
                    path: ["reactive","algebra","Reducer"],
                    content: function(root, expose) {
                        expose(Reducer, function(){
                            Cell = root.reactive.Cell;
                        });
                        
                        var Cell;
                        
                        function Reducer(id, wrap, ignoreUnset) {
                            this.id = id;
                            this.inited = false;
                            this.known = {};
                            this.wrap = wrap;
                            this.ignoreUnset = ignoreUnset;
                            this._ignoreSetUnset = false;
                        
                            this.init = init;
                            this.dispose = dispose;
                            this.remove = remove;
                            this.add = add;
                        }
                        
                        function init(data) {
                            if (this.inited) {
                                throw new Error("Can't init object twice, to reset use 'dispose'")
                            }
                            this.inited = true;
                            this._ignoreSetUnset = true;
                            this.known = {};
                            this._setIdentity();
                            this.blocks = 0;
                            if (data) data.forEach(function(item){
                                this.add(item.key, item.value);
                            }.bind(this));
                            this._ignoreSetUnset = false;
                            if (this.blocks===0) {
                                this._set();
                            } else {
                                this._unset()
                            }
                        }
                        
                        function dispose() {
                            if (!this.inited) return;
                            this._ignoreSetUnset = true;
                            for (var key in this.known) {
                                if (!this.known.hasOwnProperty(key)) continue;
                                this.known[key]();
                            }
                            this._ignoreSetUnset = false;
                            this.inited = false;
                            this.known = {};
                            if (this.blocks!=0) throw new Error();
                        }
                        
                        function remove(key) {
                            if (!this.inited) {
                                throw new Error("Reducer is not inited");
                            }
                            if (!this.known.hasOwnProperty(key)) {
                                throw new Error("Trying to delete unknown key: " + key);
                            }
                            this.known[key]();
                            delete this.known[key];
                        }
                        
                        function add(key, value) {
                            if (!this.inited) {
                                throw new Error("Reducer is not inited");
                            }
                            if (this.known.hasOwnProperty(key)) {
                                throw new Error("Trying to add a already known key: " + key);
                            }
                            if (typeof value === "object" && value.type === Cell) {
                                this.addCell(key, value);
                            } else {
                                this.addValue(key, value);
                            }
                        };
                    }
                },
                {
                    path: ["reactive","cells","BaseCell"],
                    content: function(root, expose) {
                        expose(BaseCell, function() {
                            LiftedCell = root.reactive.cells.LiftedCell;
                            CoalesceCell = root.reactive.cells.CoalesceCell;
                            WhenCell = root.reactive.cells.WhenCell;
                            BindedCell = root.reactive.cells.BindedCell;
                            Cell = root.reactive.Cell;
                        });
                        
                        var LiftedCell, CoalesceCell, WhenCell, BindedCell, Cell;
                        
                        function BaseCell() {
                            this.cellId = root.idgenerator();
                            this.type = Cell;
                            this.dependantsId = 0;
                            this.dependants = [];
                            this.content = null;
                            this.unsubscribe = null;
                            this.users = {};
                            this.usersCount = 0;
                        }
                        
                        BaseCell.prototype.unwrap = function() {
                            throw new Error("Not implemented");
                        };
                        
                        BaseCell.prototype.onEvent = function(f) {
                            var event = {
                                name: "onEvent",
                                disposed: false,
                                f: f,
                                dispose: function() {}
                            };
                        
                            root.reactive.event_broker.issue(this, event);
                        
                            return function() {
                                event.disposed = true;
                                event.dispose();
                            };
                        };
                        
                        BaseCell.prototype.leak = function(id) {
                            if (arguments.length==0) {
                                return this.leak(this.cellId);
                            }
                            root.reactive.event_broker.issue(this, {
                                name: "leak",
                                id: id
                            });
                            return this;
                        };
                        
                        BaseCell.prototype.seal = function(id) {
                            if (arguments.length==0) {
                                return this.seal(this.cellId);
                            }
                            root.reactive.event_broker.issue(this, {
                                name: "seal",
                                id: id
                            });
                            return this;
                        };
                        
                        BaseCell.prototype.lift = function(f) {
                            return new LiftedCell(this, f);
                        };
                        
                        BaseCell.prototype.bind = function(f) {
                            return new BindedCell(this, f);
                        };
                        
                        BaseCell.prototype.when = function(condition, transform, alternative) {
                            var test = typeof condition === "function" ? condition : function(value) {
                                return value === condition;
                            };
                        
                            var map = null;
                            if (arguments.length > 1) {
                                map = typeof transform === "function" ? transform : function() { return transform; };
                            }
                        
                            var alt = null;
                            if (arguments.length==3) {
                                alt = typeof alternative === "function" ? alternative : function() { return alternative; };
                            }
                        
                            var opt = {
                                condition: test,
                                transform: map,
                                alternative: alt
                            };
                        
                            return new WhenCell(this, opt);
                        };
                        
                        BaseCell.prototype.coalesce = function(replace) {
                            return new CoalesceCell(this, replace);
                        };
                        
                        BaseCell.prototype.onSet = function(f) {
                            return this.onEvent(Cell.handler({
                                set: f,
                                unset:  function() {}
                            }));
                        };
                        
                        BaseCell.prototype.isSet = function() {
                            return this.lift(function(){ return true }).coalesce(false);
                        };
                        
                        BaseCell.prototype.fireOnceOn = function(value, action) {
                            var self = this;
                            return self.leak().onEvent(Cell.handler({
                                set: function(x) {
                                    if (x===value) {
                                        self.seal();
                                        action();
                                    }
                                },
                                unset: function() {}
                            }))
                        };
                        
                        var knownEvents = {
                            seal: "_seal",
                            leak: "_leak",
                            onEvent: "_onEvent"
                        };
                        
                        BaseCell.prototype.send = function(event) {
                            if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                            if (!knownEvents.hasOwnProperty(event.name)) throw new Error("Unknown event: " + event.name);
                            this[knownEvents[event.name]].apply(this, [event]);
                        };
                        
                        BaseCell.prototype._onEvent = function(event) {
                            if (event.name!="onEvent") throw new Error();
                            if (event.disposed) return;
                        
                            var id = this.dependantsId++;
                            this.dependants.push({key: id, f: function(e) {
                                if (event.disposed) return;
                                event.f(e);
                            }});
                        
                            event.dispose = function() {
                                this.dependants = this.dependants.filter(function(d) {
                                    return d.key != id;
                                });
                            }.bind(this);
                        
                            if (this.usersCount>0 && this.content!=null) {
                                var content = this.content;
                        
                                root.reactive.event_broker.call(function(){
                                    if (event.disposed) return;
                                    if (content.isEmpty()) {
                                        event.f(["unset"]);
                                    } else {
                                        event.f(["set", content.value()]);
                                    }
                                });
                            }
                        };
                        
                        BaseCell.prototype._leak = function(event) {
                            if (event.name!="leak") throw new Error();
                            if (!event.hasOwnProperty("id")) throw new Error();
                            var id = event.id;
                            if (!this.users.hasOwnProperty(id)) {
                                this.users[id] = 0;
                            }
                            this.users[id]++;
                            this.usersCount++;
                        };
                        
                        BaseCell.prototype._seal = function(event) {
                            if (event.name!="seal") throw new Error();
                            if (!event.hasOwnProperty("id")) throw new Error();
                            var id = event.id;
                            if (!this.users.hasOwnProperty(id)) {
                                throw new Error();
                            }
                            if (this.users[id]===0) {
                                throw new Error();
                            }
                            this.users[id]--;
                            this.usersCount--;
                            if (this.users[id]===0) {
                                delete this.users[id];
                            }
                        };
                        
                        BaseCell.prototype.__raise = function(e) {
                            if (arguments.length===0) {
                                if (this.content.isEmpty()) {
                                    this.__raise(["unset"]);
                                } else {
                                    this.__raise(["set", this.content.value()]);
                                }
                                return;
                            }
                            if (this.usersCount==0) return;
                        
                            root.reactive.event_broker.call(this.dependants.map(function(d){
                                return function(){
                                    d.f(e);
                                }
                            }));
                        };
                        
                        
                    }
                },
                {
                    path: ["reactive","cells","BindedCell"],
                    content: function(root, expose) {
                        expose(BindedCell, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            Cell = root.reactive.Cell;
                            BaseCell = root.reactive.cells.BaseCell;
                        
                            SetBindedPrototype();
                        });
                        
                        var None, Some, Cell, BaseCell;
                        
                        function empty() {}
                        
                        function BindedCell(source, f) {
                            this.source = source;
                            this.f = f;
                            this.mapped = null;
                            this.unmap = empty;
                            BaseCell.apply(this);
                        }
                        
                        function SetBindedPrototype() {
                            BindedCell.prototype = new BaseCell();
                        
                            BindedCell.prototype.unwrap = function() {
                                var marker = {};
                                var value = this.source.unwrap(marker);
                                if (value !== marker) {
                                    var mapped = this.f(value);
                                    value = mapped.unwrap(marker);
                                    if (value !== marker) {
                                        return value;
                                    }
                                }
                                if (arguments.length === 0) throw new Error();
                                return arguments[0];
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                seal: "_seal"
                            };
                        
                            BindedCell.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseCell.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            BindedCell.prototype._leak = function(event) {
                                BaseCell.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.source.leak(this.cellId);
                                    this.unsource = this.source.onEvent(Cell.handler({
                                        set: function(value) {
                                            this.unmap();
                                            this.mapped = this.f(value);
                                            if (this.source == this.mapped) {
                                                throw new Error();
                                            }
                                            this.mapped.leak(this.cellId);
                                            var dispose = this.mapped.onEvent(Cell.handler({
                                                set: function(value) {
                                                    this.content = new Some(value);
                                                    this.__raise();
                                                }.bind(this),
                                                unset: function() {
                                                    this.content = new None();
                                                    this.__raise();
                                                }.bind(this)
                                            }));
                                            this.unmap = function(){
                                                dispose();
                                                this.mapped.seal(this.cellId);
                                                this.mapped = null;
                                                this.unmap = empty;
                                            }.bind(this);
                                        }.bind(this),
                                        unset: function(){
                                            this.unmap();
                                            this.content = new None();
                                            this.__raise();
                                        }.bind(this)
                                    }));
                                }
                            };
                        
                            BindedCell.prototype._seal = function(event) {
                                BaseCell.prototype._seal.apply(this, [event]);
                                if (this.usersCount === 0) {
                                    this.unsource();
                                    this.unmap();
                                    this.unsource = null;
                                    this.content = null;
                                    this.source.seal(this.cellId);
                                }
                            };
                        }
                    }
                },
                {
                    path: ["reactive","cells","CoalesceCell"],
                    content: function(root, expose) {
                        expose(CoalesceCell, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            Cell = root.reactive.Cell;
                            BaseCell = root.reactive.cells.BaseCell;
                        
                            SetCoalescePrototype();
                        });
                        
                        var None, Some, Cell, BaseCell;
                        
                        function CoalesceCell(source, replace) {
                            this.source = source;
                            this.replace = replace;
                            BaseCell.apply(this);
                        }
                        
                        function SetCoalescePrototype() {
                            CoalesceCell.prototype = new BaseCell();
                        
                            CoalesceCell.prototype.unwrap = function() {
                                return this.source.unwrap(this.replace);
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                seal: "_seal"
                            };
                        
                            CoalesceCell.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseCell.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            CoalesceCell.prototype._leak = function(event) {
                                BaseCell.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.source.leak(this.cellId);
                                    this.unsubscribe = this.source.onEvent(Cell.handler({
                                        set: function(value) {
                                            this.content = new Some(value);
                                            this.__raise();
                                        }.bind(this),
                                        unset: function(){
                                            this.content = new Some(this.replace);
                                            this.__raise();
                                        }.bind(this)
                                    }))
                                }
                            };
                        
                            CoalesceCell.prototype._seal = function(event) {
                                BaseCell.prototype._seal.apply(this, [event]);
                                if (this.usersCount === 0) {
                                    this.unsubscribe();
                                    this.unsubscribe = null;
                                    this.source.seal(this.cellId);
                                }
                            };
                        }
                    }
                },
                {
                    path: ["reactive","cells","LiftedCell"],
                    content: function(root, expose) {
                        expose(LiftedCell, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            Cell = root.reactive.Cell;
                            BaseCell = root.reactive.cells.BaseCell;
                        
                            SetLiftedPrototype();
                        });
                        
                        var None, Some, Cell, BaseCell;
                        
                        function LiftedCell(source, f) {
                            this.source = source;
                            this.f = f;
                            BaseCell.apply(this);
                        }
                        
                        function SetLiftedPrototype() {
                            LiftedCell.prototype = new BaseCell();
                        
                            LiftedCell.prototype.unwrap = function() {
                                var marker = {};
                                var value = this.source.unwrap(marker);
                                if (value !== marker) {
                                    return this.f(value);
                                } else {
                                    if (arguments.length === 0) throw new Error();
                                    return arguments[0];
                                }
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                seal: "_seal"
                            };
                        
                            LiftedCell.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseCell.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            LiftedCell.prototype._leak = function(event) {
                                BaseCell.prototype._leak.apply(this, [event]);
                        
                                if (this.usersCount === 1) {
                                    this.source.leak(this.cellId);
                                    this.unsubscribe = this.source.onEvent(Cell.handler({
                                        set: function(value) {
                                            this.content = new Some(this.f(value));
                                            this.__raise();
                                        }.bind(this),
                                        unset: function(){
                                            this.content = new None();
                                            this.__raise();
                                        }.bind(this)
                                    }))
                                }
                            };
                        
                            LiftedCell.prototype._seal = function(event) {
                                BaseCell.prototype._seal.apply(this, [event]);
                                if (this.usersCount === 0) {
                                    this.unsubscribe();
                                    this.unsubscribe = null;
                                    this.source.seal(this.cellId);
                                }
                            };
                        }
                    }
                },
                {
                    path: ["reactive","cells","WhenCell"],
                    content: function(root, expose) {
                        expose(WhenCell, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            Cell = root.reactive.Cell;
                            BaseCell = root.reactive.cells.BaseCell;
                        
                            SetWhenPrototype();
                        });
                        
                        var None, Some, Cell, BaseCell;
                        
                        function WhenCell(source, opt) {
                            this.source = source;
                            this.condition = opt.condition;
                            this.transform = opt.transform;
                            this.alternative = opt.alternative;
                            BaseCell.apply(this);
                        }
                        
                        function SetWhenPrototype() {
                            WhenCell.prototype = new BaseCell();
                        
                            WhenCell.prototype.unwrap = function() {
                                var marker = {};
                                var value = this.source.unwrap(marker);
                                if (value !== marker) {
                                    if (this.condition(value)) {
                                        if (this.transform != null) {
                                            value = {value: this.transform(value)};
                                        } else {
                                            value = {value: value};
                                        }
                                    } else {
                                        if (this.alternative != null) {
                                            value = {value: this.alternative(value)};
                                        } else {
                                            value = null;
                                        }
                                    }
                                } else {
                                    value = null;
                                }
                                if (value==null) {
                                    if (arguments.length == 0) throw new Error();
                                    return arguments[0];
                                }
                                return value.value;
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                seal: "_seal"
                            };
                        
                            WhenCell.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseCell.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            WhenCell.prototype._leak = function(event) {
                                BaseCell.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.source.leak(this.cellId);
                                    this.unsubscribe = this.source.onEvent(Cell.handler({
                                        set: function(value) {
                                            if (this.condition(value)) {
                                                if (this.transform != null) {
                                                    value = {value: this.transform(value)};
                                                } else {
                                                    value = {value: value};
                                                }
                                            } else if (this.alternative != null) {
                                                value = {value: this.alternative(value)};
                                            } else {
                                                value = null;
                                            }
                        
                                            if (value != null) {
                                                if (!isEmpty(this) && this.content.value()===value.value) return;
                                                this.content = new Some(value.value);
                                            } else {
                                                if (isEmpty(this)) return;
                                                this.content = new None();
                                            }
                                            this.__raise();
                                        }.bind(this),
                                        unset: function(){
                                            if (this.content != null && this.content.isEmpty()) return;
                                            this.content = new None();
                                            this.__raise();
                                        }.bind(this)
                                    }))
                                }
                            };
                        
                            WhenCell.prototype._seal = function(event) {
                                BaseCell.prototype._seal.apply(this, [event]);
                                if (this.usersCount === 0) {
                                    this.unsubscribe();
                                    this.unsubscribe = null;
                                    this.content = null;
                                    this.source.seal(this.cellId);
                                }
                            };
                        
                            function isEmpty(self) {
                                if (self.content === null) return true;
                                return self.content.isEmpty();
                            }
                        }
                    }
                },
                {
                    path: ["reactive","event_broker"],
                    content: function(root, expose) {
                        expose(new EventBroker());
                        
                        function EventBroker() {
                            this.events = [];
                            this.isActive = false;
                        
                            this.issue = function(reciever, event) {
                                this.events.push({
                                    type: "message",
                                    body: [reciever, event]
                                });
                                this.process();
                            };
                        
                            this.call = function(f) {
                                if (f instanceof Array) {
                                    for (var i=0;i < f.length;i++) {
                                        if (typeof f[i] != "function") throw new Error();
                                        this.events.push({
                                            type: "call",
                                            f: f[i]
                                        });
                                    }
                                } else if (typeof f == "function") {
                                    this.events.push({
                                        type: "call",
                                        f: f
                                    });
                                } else {
                                    throw new Error();
                                }
                        
                                this.process();
                            };
                        
                            this.process = function() {
                                if (this.isActive) return;
                                this.isActive = true;
                                while(this.events.length!=0) {
                                    var event = this.events.shift();
                                    if (event.type=="message") {
                                        var message = event.body;
                                        message[0].send(message[1]);
                                    } else if (event.type=="call") {
                                        event.f();
                                    } else {
                                        throw new Error();
                                    }
                                }
                                this.isActive = false;
                            };
                        }
                        
                    }
                },
                {
                    path: ["reactive","lists","BaseList"],
                    content: function(root, expose) {
                        expose(BaseList, function() {
                            List = root.reactive.List;
                            GroupReducer = root.reactive.algebra.GroupReducer;
                            MonoidReducer = root.reactive.algebra.MonoidReducer;
                            ReducedList = root.reactive.lists.ReducedList;
                            LiftedList = root.reactive.lists.LiftedList;
                            Cell = root.reactive.Cell;
                            checkBool = root.utils.checkBool;
                        });
                        
                        var Cell, List, GroupReducer, MonoidReducer, LiftedList, ReducedList, checkBool;
                        
                        function BaseList() {
                            this.listId = root.idgenerator();
                            this.type = List;
                            this.dependantsId = 0;
                            this.dependants = [];
                            this.users = {};
                            this.usersCount = 0;
                            this.data = [];
                        }
                        
                        BaseList.prototype.unwrap = function(f) {
                            throw new Error("Not implemented");
                        };
                        
                        BaseList.prototype.onEvent = function(f) {
                            var event = {
                                name: "onEvent",
                                disposed: false,
                                f: f,
                                dispose: function() {}
                            };
                        
                            root.reactive.event_broker.issue(this, event);
                        
                            return function() {
                                event.disposed = true;
                                event.dispose();
                            };
                        };
                        
                        BaseList.prototype.leak = function(id) {
                            if (arguments.length==0) {
                                return this.leak(this.listId);
                            }
                            root.reactive.event_broker.issue(this, {
                                name: "leak",
                                id: id
                            });
                            return this;
                        };
                        
                        BaseList.prototype.seal = function(id) {
                            if (arguments.length==0) {
                                return this.seal(this.listId);
                            }
                            root.reactive.event_broker.issue(this, {
                                name: "seal",
                                id: id
                            });
                            return this;
                        };
                        
                        BaseList.prototype.lift = function(f) {
                            return new LiftedList(this, f);
                        };
                        
                        BaseList.prototype.reduceGroup = function(group, opt) {
                            if (!opt) opt = {};
                            if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
                            if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
                            if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;
                        
                            return new ReducedList(this, GroupReducer, group, opt.wrap, opt.unwrap, opt.ignoreUnset);
                        };
                        
                        BaseList.prototype.reduceMonoid = function(monoid, opt) {
                            if (!opt) opt = {};
                            if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
                            if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
                            if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;
                        
                            return new ReducedList(this, MonoidReducer, monoid, opt.wrap, opt.unwrap, opt.ignoreUnset);
                        };
                        
                        BaseList.prototype.reduce = function(identity, add, opt) {
                            return this.reduceMonoid({
                                identity: function() {return identity; },
                                add: add
                            }, opt);
                        };
                        
                        BaseList.prototype.all = function(predicate) {
                            return this.lift(predicate).reduceGroup({
                                identity: function() { return [0,0]; },
                                add: function(x,y) { return [x[0]+y[0],x[1]+y[1]]; },
                                invert: function(x) { return [-x[0],-x[1]]; }
                            },{
                                wrap: function(x) { return checkBool(x) ? [1,1] : [0,1]; },
                                unwrap: function(x) { return x[0]==x[1]; }
                            });
                        };
                        
                        BaseList.prototype.count = function() {
                            var predicate = arguments.length===0 ? function() { return true; } : arguments[0];
                        
                            return this.lift(function(x){
                                x = predicate(x);
                                if (typeof x === "object" && x.type === Cell) {
                                    return x.lift(function(x) { return checkBool(x) ? 1 : 0; });
                                }
                                return checkBool(x) ? 1 : 0;
                            }).reduceGroup({
                                identity: function() { return 0; },
                                add: function(x,y) { return x+y; },
                                invert: function(x) { return -x; }
                            });
                        };
                        
                        var knownEvents = {
                            seal: "_seal",
                            leak: "_leak",
                            onEvent: "_onEvent"
                        };
                        
                        BaseList.prototype.send = function(event) {
                            if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                            if (!knownEvents.hasOwnProperty(event.name)) throw new Error("Unknown event: " + event.name);
                            this[knownEvents[event.name]].apply(this, [event]);
                        };
                        
                        BaseList.prototype._onEvent = function(event) {
                            if (event.name!="onEvent") throw new Error();
                            if (event.disposed) return;
                        
                            var id = this.dependantsId++;
                            this.dependants.push({key: id, f: function(e) {
                                if (event.disposed) return;
                                event.f(e);
                            }});
                        
                            event.dispose = function() {
                                this.dependants = this.dependants.filter(function(d) {
                                    return d.key != id;
                                });
                            }.bind(this);
                        
                            if (this.usersCount>0) {
                                var data = this.data.slice();
                        
                                root.reactive.event_broker.call(function(){
                                    if (event.disposed) return;
                                    event.f(["data", data]);
                                });
                            }
                        };
                        
                        BaseList.prototype._leak = function(event) {
                            if (event.name!="leak") throw new Error();
                            if (!event.hasOwnProperty("id")) throw new Error();
                            var id = event.id;
                            if (!this.users.hasOwnProperty(id)) {
                                this.users[id] = 0;
                            }
                            this.users[id]++;
                            this.usersCount++;
                        };
                        
                        BaseList.prototype._seal = function(event) {
                            if (event.name!="seal") throw new Error();
                            if (!event.hasOwnProperty("id")) throw new Error();
                            var id = event.id;
                            if (!this.users.hasOwnProperty(id)) {
                                throw new Error();
                            }
                            if (this.users[id]===0) {
                                throw new Error();
                            }
                            this.users[id]--;
                            this.usersCount--;
                            if (this.users[id]===0) {
                                delete this.users[id];
                            }
                        };
                        
                        
                        BaseList.prototype.__raise = function(e) {
                            if (this.usersCount>0) {
                        
                                root.reactive.event_broker.call(this.dependants.map(function(d){
                                    return function() {
                                        d.f(e);
                                    };
                                }));
                            }
                        };
                        
                        
                        
                    }
                },
                {
                    path: ["reactive","lists","LiftedList"],
                    content: function(root, expose) {
                        expose(LiftedList, function(){
                            BaseList = root.reactive.lists.BaseList;
                            List = root.reactive.List;
                        
                            SetLiftedPrototype();
                        });
                        
                        var BaseList, List;
                        
                        function LiftedList(source, f) {
                            this.source = source;
                            this.f = f;
                            BaseList.apply(this);
                        }
                        
                        function SetLiftedPrototype() {
                            LiftedList.prototype = new BaseList();
                        
                            LiftedList.prototype.unwrap = function() {
                                return this.source.unwrap().map(function(item){
                                    return this.f(item);
                                }.bind(this));
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                seal: "_seal"
                            };
                        
                            LiftedList.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseList.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            LiftedList.prototype._leak = function(event) {
                                BaseList.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.source.leak(this.listId);
                                    this.unsubscribe = this.source.onEvent(List.handler({
                                        data: function(data) {
                                            this.data = data.map(function(item){
                                                return {key: item.key, value: this.f(item.value)};
                                            }.bind(this));
                                            this.__raise(["data", this.data.slice()]);
                                        }.bind(this),
                                        add: function(item) {
                                            item = {key: item.key, value: this.f(item.value)};
                                            this.data.push(item);
                                            this.__raise(["add", item]);
                                        }.bind(this),
                                        remove: function(key){
                                            this.data = this.data.filter(function(item){
                                                return item.key != key;
                                            });
                                            this.__raise(["remove", key]);
                                        }.bind(this)
                                    }))
                                }
                            };
                        
                            LiftedList.prototype._seal = function(event) {
                                BaseList.prototype._seal.apply(this, [event]);
                                if (this.usersCount === 0) {
                                    this.unsubscribe();
                                    this.unsubscribe = null;
                                    this.source.seal(this.listId);
                                }
                            };
                        }
                    }
                },
                {
                    path: ["reactive","lists","ReducedList"],
                    content: function(root, expose) {
                        expose(ReducedList, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            Cell = root.reactive.Cell;
                            List = root.reactive.List;
                            BaseCell = root.reactive.cells.BaseCell;
                        
                            SetPrototype();
                        });
                        
                        var None, Some, Cell, BaseCell, List;
                        
                        function ReducedList(list, Reducer, algebraicStructure, wrap, unwrap, ignoreUnset) {
                            BaseCell.apply(this);
                            this.handler = null;
                            this.list = list;
                            this.Reducer = Reducer;
                        
                            this._monoid = algebraicStructure;
                            this._unwrap = unwrap;
                            this._wrap = wrap;
                            this._ignoreUnset = ignoreUnset;
                        }
                        
                        
                        function SetPrototype() {
                            ReducedList.prototype = new BaseCell();
                        
                            ReducedList.prototype.unwrap = function() {
                                var blocked = false;
                                var data = this.list.unwrap().map(function(value){
                                    if (typeof value === "object" && value.type === Cell) {
                                        var marker = {};
                                        value = value.unwrap(marker);
                                        if (marker===value) {
                                            blocked = true;
                                            return this._monoid.identity();
                                        }
                                        return value;
                                    }
                                    return value;
                                }.bind(this));
                                if (!this._ignoreUnset && blocked) {
                                    if (arguments.length === 0) throw new Error();
                                    return arguments[0];
                                }
                        
                                var sum = this._monoid.identity();
                                data.forEach(function(item){
                                    sum = this._monoid.add(sum, this._wrap(item));
                                }.bind(this));
                                return this._unwrap(sum);
                            };
                        
                            var knownEvents = {
                                leak: "_leak",
                                seal: "_seal"
                            };
                        
                            ReducedList.prototype.send = function(event) {
                                if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
                                if (knownEvents.hasOwnProperty(event.name)) {
                                    this[knownEvents[event.name]].apply(this, [event]);
                                } else {
                                    BaseCell.prototype.send.apply(this, [event]);
                                }
                            };
                        
                            ReducedList.prototype._leak = function(event) {
                                BaseCell.prototype._leak.apply(this, [event]);
                                if (this.usersCount === 1) {
                                    this.list.leak(this.cellId);
                                    this.unsubscribe = this.list.onEvent(List.handler({
                                        data: function(data) {
                                            if (this.reducer!=null) {
                                                this.reducer.dispose();
                                            }
                                            this.reducer = new this.Reducer(this.cellId, this._monoid, this._wrap, this._ignoreUnset, function(e){
                                                if (e[0]=="set") {
                                                    this.content = new Some(this._unwrap(e[1]));
                                                } else if (e[0]=="unset") {
                                                    this.content = new None();
                                                } else {
                                                    throw new Error();
                                                }
                                                this.__raise();
                                            }.bind(this));
                                            this.reducer.init(data);
                                        }.bind(this),
                                        add: function(item) {
                                            this.reducer.add(item.key, item.value);
                                        }.bind(this),
                                        remove: function(key) {
                                            this.reducer.remove(key);
                                        }.bind(this)
                                    }));
                                }
                            };
                        
                            ReducedList.prototype._seal = function(event) {
                                BaseCell.prototype._seal.apply(this, [event]);
                                if (this.usersCount === 0) {
                                    this.unsubscribe();
                                    this.unsubscribe = null;
                        
                                    this.reducer.dispose();
                                    this.reducer = null;
                        
                                    this.list.seal(this.cellId);
                                }
                            };
                        }
                        
                    }
                },
                {
                    path: ["reactive","utils"],
                    content: function(root, expose) {
                        expose({
                            unwrapObject: unwrapObject
                        }, function(){
                            Cell = root.reactive.Cell;
                            List = root.reactive.List;
                        });
                        
                        var Cell, List;
                        
                        function unwrapObject(obj, opt) {
                            if (typeof obj == "function") {
                                throw new Error("Can't unwrap functions");
                            }
                            if (typeof obj != "object") {
                                return new Cell(obj);
                            }
                            if (obj instanceof Skip) return new Cell(obj);
                            if (obj.type === Cell) {
                                return obj.bind(function(value){
                                    return unwrapObject(value);
                                });
                            }
                            if (obj.type === List) {
                                return obj.lift(unwrapObject).reduce(
                                    [], function(a,b) { return a.concat(b); }, {
                                        wrap: function(x) { return [x]; },
                                        ignoreUnset: true
                                    }
                                );
                            }
                            var disassembled = [];
                            for (var key in obj) {
                                if (!obj.hasOwnProperty(key)) continue;
                                if (typeof obj[key] == "function") continue;
                                (function(key){
                                    disassembled.push(unwrapObject(obj[key]).lift(function(value){
                                        return new Skip({key: key, value: value});
                                    }));
                                })(key);
                            }
                            return unwrapObject(new List(disassembled)).lift(function(items){
                                var obj = {};
                                for (var i=0;i<items.length;i++) {
                                    var kv = items[i].value;
                                    obj[kv.key] = kv.value;
                                }
                                return obj;
                            });
                        }
                        
                        function Skip(value) {
                            this.value = value;
                        }
                        
                    }
                },
                {
                    path: ["tng","Matter"],
                    content: function(root, expose) {
                        expose(Matter);
                        
                        
                        function Matter() {
                            this._atoms = [];
                            this.instanceof = of;
                            this.attach = attach;
                            this.metaType = Matter;
                        }
                        
                        function attach(atom) {
                            if (this.instanceof(atom)) {
                                return;
                            }
                            this._atoms.push(atom);
                        }
                        
                        function of(atom) {
                            for (var i=0;i<this._atoms.length;i++) {
                                if (this._atoms[i]===atom) return true;
                            }
                            return false;
                        }
                    }
                },
                {
                    path: ["tng","dag","DAG"],
                    content: function(root, expose) {
                        var dag = new DAG();
                        
                        expose(dag, function(){
                            Node = root.tng.dag.Node;
                            Set = root.adt.Set;
                            SortedList = root.adt.SortedList;
                            event_broker = root.tng.event_broker;
                        
                            dag.reset();
                        });
                        
                        var Node, SortedList, Set, event_broker;
                        
                        function DAG() {}
                        
                        DAG.prototype.reset = function() {
                            this.nodes = {};
                            this.length = 0;
                            this.dependencies = {};
                            this.dependants = {};
                        
                            this.changed = new SortedList(function(a,b){
                                return a.nodeRank - b.nodeRank;
                            });
                        };
                        
                        DAG.prototype.addNode = function(node) {
                            if (knownNode(this, node)) {
                                throw new Error();
                            }
                            this.nodes[node.nodeId] = node;
                            this.dependencies[node.nodeId] = [];
                            this.dependants[node.nodeId] = [];
                            this.length++;
                        };
                        
                        DAG.prototype.removeNode = function(node) {
                            if (!knownNode(this, node)) {
                                throw new Error();
                            }
                            if (this.dependants[node.nodeId].length!=0) {
                                throw new Error();
                            }
                            if (this.dependencies[node.nodeId].length!=0) {
                                throw new Error();
                            }
                            delete this.nodes[node.nodeId];
                            delete this.dependants[node.nodeId];
                            delete this.dependencies[node.nodeId];
                            this.length--;
                        };
                        
                        DAG.prototype.addRelation = function(from, to) {
                            if (inRelation(this, from, to) || inRelation(this, to, from)) {
                                throw new Error();
                            }
                            this.dependencies[to.nodeId].push(from.nodeId);
                            this.dependants[from.nodeId].push(to.nodeId);
                            calcRank(this, to);
                        };
                        
                        DAG.prototype.removeRelation = function(from, to) {
                            if (!inRelation(this, from, to)) {
                                throw new Error();
                            }
                        
                            var len = this.dependencies[to.nodeId].length;
                            this.dependencies[to.nodeId] = this.dependencies[to.nodeId].filter(function(item){
                                return item != from.nodeId;
                            });
                            if (len != this.dependencies[to.nodeId].length+1) throw new Error();
                        
                            len = this.dependants[from.nodeId].length;
                            this.dependants[from.nodeId] = this.dependants[from.nodeId].filter(function(item){
                                return item != to.nodeId;
                            });
                            if (len != this.dependants[from.nodeId].length+1) throw new Error();
                        
                            calcRank(this, to);
                        };
                        
                        DAG.prototype.notifyChanged = function(node) {
                            if (!knownNode(this, node)) {
                                throw new Error();
                            }
                            this.changed.push(node);
                        };
                        
                        DAG.prototype.propagate = function() {
                            while (this.changed.length>0) {
                                var front = this.changed.pop();
                                var info = front.dependenciesChanged();
                                if (!info.hasChanges) continue;
                        
                                for (var i=0;i<this.dependants[front.nodeId].length;i++) {
                                    var node = this.nodes[this.dependants[front.nodeId][i]];
                                    if (!node.changed.hasOwnProperty(front.nodeId)) {
                                        node.changed[front.nodeId] = [];
                                    }
                                    for (var j=0;j<info.changeSet.length;j++) {
                                        node.changed[front.nodeId].push(info.changeSet[j]);
                                    }
                                    this.changed.push(node);
                                }
                            }
                        };
                        
                        function knownNode(dag, node) {
                            if (!node.instanceof(Node)) {
                                throw new Error();
                            }
                            return dag.nodes.hasOwnProperty(node.nodeId);
                        }
                        
                        function inRelation(dag, from, to) {
                            if (!knownNode(dag, from) || !knownNode(dag, to)) {
                                throw new Error();
                            }
                            if (dag.dependencies[to.nodeId].indexOf(from.nodeId) >= 0) {
                                if (dag.dependants[from.nodeId].indexOf(to.nodeId)<0) {
                                    throw new Error();
                                }
                                return true;
                            } else {
                                if (dag.dependants[from.nodeId].indexOf(to.nodeId)>=0) {
                                    throw new Error();
                                }
                            }
                            return false;
                        }
                        
                        function calcRank(dag, node) {
                            var rank = 0;
                            dag.dependencies[node.nodeId].forEach(function(nodeId){
                                rank = Math.max(dag.nodes[nodeId].nodeRank+1, rank);
                            });
                            node.nodeRank = rank;
                        }
                    }
                },
                {
                    path: ["tng","dag","Node"],
                    content: function(root, expose) {
                        expose(Node, function(){});
                        
                        
                        function Node() {
                            this.attach(Node);
                            this.nodeId = root.idgenerator();
                            this.changed = {};
                            this.delta = null;
                            this.nodeRank = 0;
                        }
                        
                    }
                },
                {
                    path: ["tng","do"],
                    content: function(root, expose) {
                        expose(_do, function(){
                            DependentCell = root.tng.reactive.DependentCell;
                        });
                        
                        var DependentCell;
                        
                        function _do(f, context) {
                            return new DependentCell(f, context);
                        }
                    }
                },
                {
                    path: ["tng","empty"],
                    content: function(root, expose) {
                        expose(empty);
                        
                        function empty() {
                            throw new root.tng.reactive.EmptyError();
                        }
                    }
                },
                {
                    path: ["tng","event_broker"],
                    content: function(root, expose) {
                        expose(new EventBroker());
                        
                        function EventBroker() {
                            this.changeRequests = [];
                        
                            // TODO: replace to set
                            this.nodesToNotify = [];
                            this.dependantsToNotify = [];
                        
                            this.active = false;
                            this.isOnProcessCall = false;
                        }
                        
                        EventBroker.prototype.postponeChange = function(node, change) {
                            this.changeRequests.push({
                                node: node,
                                change: change
                            });
                            this.loop();
                        };
                        
                        EventBroker.prototype.notify = function(node) {
                            this.nodesToNotify.push(node);
                        };
                        
                        EventBroker.prototype.notifySingle = function(node, dependant) {
                            this.dependantsToNotify.push({node: node, dependant: dependant});
                        };
                        
                        EventBroker.prototype.invokeOnProcess = function(obj, f, args) {
                            if (this.isOnProcessCall) {
                                return f.apply(obj, args);
                            } else {
                                this.isOnProcessCall = true;
                                var result = f.apply(obj, args);
                                this.isOnProcessCall = false;
                                this.loop();
                                return result;
                            }
                        };
                        
                        EventBroker.prototype.loop = function() {
                            if (this.active) return;
                            this.active = true;
                        
                            while(this.changeRequests.length + this.nodesToNotify.length + this.dependantsToNotify.length > 0) {
                                var hasChanges = false;
                                while (this.changeRequests.length!=0) {
                                    var request = this.changeRequests.shift();
                                    if (request.node.applyChange(request.change)) {
                                        hasChanges = true;
                                        if (request.node.usersCount > 0) {
                                            root.tng.dag.DAG.notifyChanged(request.node);
                                        }
                                    }
                                }
                                if (hasChanges) {
                                    root.tng.dag.DAG.propagate();
                                }
                                if (this.nodesToNotify.length!=0) {
                                    var node = this.nodesToNotify.shift();
                                    node.sendAllMessages();
                                    continue;
                                }
                                if (this.dependantsToNotify.length!=0) {
                                    var info = this.dependantsToNotify.shift();
                                    info.node.sendItsMessages(info.dependant);
                                    continue;
                                }
                            }
                        
                            this.active = false;
                        };
                        
                    }
                },
                {
                    path: ["tng","reactive","AggregatedCell"],
                    content: function(root, expose) {
                        expose(AggregatedCell, function(){
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            BaseCell = root.tng.reactive.BaseCell;
                            List = root.tng.reactive.lists.List;
                            DAG = root.tng.dag.DAG;
                            event_broker = root.tng.event_broker;
                            tracker = root.tng.tracker;
                            Matter = root.tng.Matter;
                        
                            SetPrototype();
                        });
                        
                        var DAG, None, Some, BaseCell, List, Matter, event_broker, tracker;
                        
                        function AggregatedCell(list, Reducer, algebraicStructure, wrap, unwrap, ignoreUnset) {
                            BaseCell.apply(this);
                            this.attach(AggregatedCell);
                        
                            this.list = list;
                            this.Reducer = Reducer;
                        
                            this.itemIdToNodeId = {};
                            this.nodeIdToItemIds = {};
                            this.dependencies = {};
                            this.reducer = null;
                            this.content = null;
                        
                            this._monoid = algebraicStructure;
                            this._wrap = wrap;
                            this._unwrap = unwrap;
                            this._ignoreUnset = ignoreUnset;
                        }
                        
                        
                        function SetPrototype() {
                            AggregatedCell.prototype = new BaseCell();
                        
                            // dependenciesChanged is being called during propagating only (!)
                        
                            AggregatedCell.prototype.dependenciesChanged = function() {
                                // guard
                                for (var nodeId in this.changed) {
                                    if (!this.changed.hasOwnProperty(nodeId)) continue;
                                    if (nodeId == this.list.nodeId) continue;
                                    if (!this.dependencies.hasOwnProperty(nodeId)) {
                                        throw new Error();
                                    }
                                    if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                                        throw new Error();
                                    }
                                }
                        
                                if (this.changed.hasOwnProperty(this.list.nodeId)) {
                                    for (var i=0;i<this.changed[this.list.nodeId].length;i++) {
                                        var change = this.changed[this.list.nodeId][i];
                                        if (change[0]=="reset") {
                                            var data = change[1];
                                            this._dispose();
                                            this.reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
                                            for (var j=0;j<data.length;j++) {
                                                this._addItem(data[j].key, data[j].value);
                                            }
                                        } else if (change[0]=="add") {
                                            var item = change[1];
                                            this._addItem(item.key, item.value);
                                        } else if (change[0]=="remove") {
                                            var key = change[1];
                                            this._removeItem(key);
                                        } else {
                                            throw new Error("Unknown event: " + change[0]);
                                        }
                                    }
                                    delete this.changed[this.list.nodeId];
                                }
                        
                                for (var nodeId in this.changed) {
                                    if (!this.changed.hasOwnProperty(nodeId)) continue;
                                    if (!this.dependencies.hasOwnProperty(nodeId)) {
                                        continue;
                                    }
                                    if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                                        continue;
                                    }
                        
                                    for (var i=0;i<this.changed[nodeId].length;i++) {
                                        var change = this.changed[nodeId][i];
                                        for (var j=0;j<this.nodeIdToItemIds[nodeId].length;j++) {
                                            var itemId = this.nodeIdToItemIds[nodeId][j];
                                            this.reducer.update(itemId, change);
                                        }
                                    }
                                }
                        
                                this.changed = {};
                        
                                var value = this.reducer.value.lift(this._unwrap);
                                if (value.isEqualTo(this.content)) {
                                    return { hasChanges: false };
                                }
                                this.content = value;
                                this._putEventToDependants(this.content.isEmpty() ? ["unset"] : ["set", this.content.value()]);
                                event_broker.notify(this);
                        
                                return {
                                    hasChanges: true,
                                    changeSet: [this.content]
                                };
                            };
                        
                            // _leak & _seal are called only by onChange
                        
                            AggregatedCell.prototype._leak = function(id) {
                                BaseCell.prototype._leak.apply(this, [id]);
                        
                                if (this.usersCount === 1) {
                                    DAG.addNode(this);
                                    this.list._leak(this.nodeId);
                                    DAG.addRelation(this.list, this);
                        
                                    this.reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
                                    for (var j=0;j<this.list.data.length;j++) {
                                        this._addItem(this.list.data[j].key, this.list.data[j].value);
                                    }
                                    this.content = this.reducer.value.lift(this._unwrap);
                                }
                            };
                        
                            AggregatedCell.prototype._seal = function(id) {
                                id = arguments.length==0 ? this.nodeId : id;
                                BaseCell.prototype._seal.apply(this, [id]);
                        
                                if (this.usersCount === 0) {
                                    this._dispose();
                                    DAG.removeRelation(this.list, this);
                                    this.list._seal(this.nodeId);
                                    DAG.removeNode(this);
                                    this.content = null;
                                }
                            };
                        
                            // gets
                        
                            AggregatedCell.prototype.hasValue = function() {
                                var marker = {};
                                return this.unwrap(marker) !== marker;
                            };
                        
                            AggregatedCell.prototype.unwrap = function(alt) {
                                tracker.track(this);
                        
                                var value = this.content;
                                if (this.usersCount===0) {
                                    var reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
                                    var data = this.list.unwrap();
                                    var marker = {};
                                    var id = 0;
                                    for (var i=0;i<data.length;i++) {
                                        if (data[i].metaType === Matter && data[i].instanceof(BaseCell)) {
                                            var item = data[i].unwrap(marker);
                                            if (item===marker) {
                                                reducer.add(id++, new None());
                                            } else {
                                                reducer.add(id++, new Some(item));
                                            }
                                        } else {
                                            reducer.add(id++, new Some(data[i]));
                                        }
                                    }
                                    value = reducer.value;
                                }
                                return value.unwrap.apply(value, arguments);
                            };
                        
                            // internal
                        
                            AggregatedCell.prototype._dispose = function() {
                                for (var nodeId in this.dependencies) {
                                    if (!this.dependencies.hasOwnProperty(nodeId)) continue;
                                    DAG.removeRelation(this.dependencies[nodeId], this);
                                    this.dependencies[nodeId]._seal(this.nodeId);
                                }
                                this.itemIdToNodeId = {};
                                this.nodeIdToItemIds = {};
                                this.dependencies = {};
                                this.reducer = null;
                                this.content = null;
                            };
                        
                            AggregatedCell.prototype._addItem = function(key, value) {
                                if (value.metaType === Matter && value.instanceof(BaseCell)) {
                                    if (this.itemIdToNodeId.hasOwnProperty(key)) {
                                        throw new Error();
                                    }
                                    this.itemIdToNodeId[key] = value.nodeId;
                                    if (!this.nodeIdToItemIds.hasOwnProperty(value.nodeId)) {
                                        this.nodeIdToItemIds[value.nodeId] = [];
                                    }
                                    this.nodeIdToItemIds[value.nodeId].push(key);
                        
                                    if (this.nodeIdToItemIds[value.nodeId].length==1) {
                                        this.dependencies[value.nodeId] = value;
                                        value._leak(this.nodeId);
                                        DAG.addRelation(value, this);
                                    }
                        
                                    this.reducer.add(key, value.content);
                                } else {
                                    this.reducer.add(key, new Some(value));
                                }
                            };
                        
                            AggregatedCell.prototype._removeItem = function(key) {
                                this.reducer.remove(key);
                                if (this.itemIdToNodeId.hasOwnProperty(key)) {
                                    var nodeId = this.itemIdToNodeId[key];
                                    if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                                        throw new Error();
                                    }
                                    this.nodeIdToItemIds[nodeId] = this.nodeIdToItemIds[nodeId].filter(function(item){
                                        return item != key;
                                    });
                                    if (this.nodeIdToItemIds[nodeId].length==0) {
                                        var node = this.dependencies[nodeId];
                                        DAG.removeRelation(node, this);
                                        node._seal(this.nodeId);
                                        delete this.dependencies[nodeId];
                                        delete this.nodeIdToItemIds[nodeId];
                                    }
                                }
                                delete this.itemIdToNodeId[key];
                            };
                        
                        //    AggregatedCell.prototype.unwrap = function() {
                        //        var blocked = false;
                        //        var data = this.list.unwrap().map(function(value){
                        //            if (typeof value === "object" && value.type === Cell) {
                        //                var marker = {};
                        //                value = value.unwrap(marker);
                        //                if (marker===value) {
                        //                    blocked = true;
                        //                    return this._monoid.identity();
                        //                }
                        //                return value;
                        //            }
                        //            return value;
                        //        }.bind(this));
                        //        if (!this._ignoreUnset && blocked) {
                        //            if (arguments.length === 0) throw new Error();
                        //            return arguments[0];
                        //        }
                        //
                        //        var sum = this._monoid.identity();
                        //        data.forEach(function(item){
                        //            sum = this._monoid.add(sum, this._wrap(item));
                        //        }.bind(this));
                        //        return this._unwrap(sum);
                        //    };
                        }
                        
                    }
                },
                {
                    path: ["tng","reactive","BaseCell"],
                    content: function(root, expose) {
                        expose(BaseCell, function(){
                            Matter = root.tng.Matter;
                            Node = root.tng.dag.Node;
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            event_broker = root.tng.event_broker;
                            tracker = root.tng.tracker;
                            EmptyError = root.tng.reactive.EmptyError;
                            DAG = root.tng.dag.DAG;
                            uid = root.idgenerator;
                            empty = root.tng.empty;
                        });
                        
                        var Matter, Node, None, Some, event_broker, EmptyError, DAG, tracker, uid, empty;
                        
                        function BaseCell() {
                            root.tng.Matter.apply(this, []);
                            root.tng.dag.Node.apply(this, []);
                            this.attach(BaseCell);
                        
                            this.dependants = [];
                            this.users = {};
                            this.usersCount = 0;
                        }
                        
                        BaseCell.prototype.sendAllMessages = function() {
                            for (var i=0;i<this.dependants.length;i++) {
                                this.sendItsMessages(this.dependants[i]);
                            }
                        };
                        
                        BaseCell.prototype.sendItsMessages = function(dependant) {
                            if (dependant.disabled) return;
                            if (dependant.mailbox.length==0) return;
                            var event = dependant.mailbox[dependant.mailbox.length - 1];
                            dependant.mailbox = [];
                            dependant.f(this, event);
                        };
                        
                        BaseCell.prototype.onChange = function(f) {
                            if (!event_broker.isOnProcessCall) {
                                return event_broker.invokeOnProcess(this, this.onChange, [f]);
                            }
                        
                            this._leak(this.nodeId);
                        
                            var self = this;
                        
                            var dependant = {
                                key: uid(),
                                f: function(obj) {
                                    if (this.disposed) return;
                                    f(obj);
                                },
                                disposed: false,
                                mailbox: [ this.content.isEmpty() ? ["unset"] : ["set", this.content.value()]]
                            };
                        
                            this.dependants.push(dependant);
                        
                            if (this.usersCount > 0) {
                                event_broker.notifySingle(this, dependant);
                            }
                        
                            return function() {
                                if (dependant.disposed) return;
                                self._seal(self.nodeId);
                                dependant.disposed = true;
                                self.dependants = self.dependants.filter(function(d) {
                                    return d.key != dependant.key;
                                });
                            };
                        };
                        
                        BaseCell.prototype._leak = function(id) {
                            if (!this.users.hasOwnProperty(id)) {
                                this.users[id] = 0;
                            }
                            this.users[id]++;
                            this.usersCount++;
                        };
                        
                        BaseCell.prototype._seal = function(id) {
                            if (!this.users.hasOwnProperty(id)) {
                                throw new Error();
                            }
                            if (this.users[id]===0) {
                                throw new Error();
                            }
                            this.users[id]--;
                            this.usersCount--;
                            if (this.users[id]===0) {
                                delete this.users[id];
                            }
                        };
                        
                        BaseCell.prototype._putEventToDependants = function(event) {
                            for (var i=0;i<this.dependants.length;i++) {
                                this.dependants[i].mailbox.push(event);
                            }
                        };
                        
                        // extensions
                        
                        BaseCell.prototype.coalesce = function(value) {
                            return root.tng.do(function(){
                                return this.unwrap(value);
                            }, this);
                        };
                        
                        BaseCell.prototype.lift = function(f) {
                            return root.tng.do(function(){
                                return f(this.unwrap());
                            }, this);
                        };
                        
                        BaseCell.prototype.when = function(condition, transform, alternative) {
                            var test = typeof condition === "function" ? condition : function(value) {
                                return value === condition;
                            };
                        
                            var map = null;
                            if (arguments.length > 1) {
                                map = typeof transform === "function" ? transform : function() { return transform; };
                            }
                        
                            var alt = null;
                            if (arguments.length==3) {
                                alt = typeof alternative === "function" ? alternative : function() { return alternative; };
                            }
                        
                            return root.tng.do(function(){
                                var value = this.unwrap();
                                if (test(value)) {
                                    return map != null ? map(value) : value;
                                } else {
                                    return alt != null ? alt(value) : empty();
                                }
                            }, this);
                        };
                    }
                },
                {
                    path: ["tng","reactive","Cell"],
                    content: function(root, expose) {
                        expose(Cell, function(){
                            BaseCell = root.tng.reactive.BaseCell;
                            Matter = root.tng.Matter;
                            Node = root.tng.dag.Node;
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            event_broker = root.tng.event_broker;
                            tracker = root.tng.tracker;
                            EmptyError = root.tng.reactive.EmptyError;
                            DAG = root.tng.dag.DAG;
                        
                            SetCellPrototype();
                        });
                        
                        var BaseCell, Matter, Node, None, Some, event_broker, EmptyError, DAG, tracker;
                        
                        function Cell() {
                            BaseCell.apply(this, []);
                            this.attach(Cell);
                        
                            if (arguments.length!=0) {
                                this.content = new Some(arguments[0]);
                            } else {
                                this.content = new None();
                            }
                        }
                        
                        function SetCellPrototype() {
                            Cell.prototype = new BaseCell();
                        
                            // set and unset called only outside of propagating
                        
                            Cell.prototype.set = function(value) {
                                event_broker.postponeChange(this, {value: value});
                            };
                        
                            Cell.prototype.unset = function() {
                                event_broker.postponeChange(this, null);
                            };
                        
                            Cell.prototype.applyChange = function(change) {
                                if (change == null) {
                                    return this._update(new None(), ["unset"]);
                                } else {
                                    return this._update(new Some(change.value), ["set", change.value]);
                                }
                            };
                        
                            // dependenciesChanged is being called during propagating only (!)
                        
                            Cell.prototype.dependenciesChanged = function() {
                                return {
                                    hasChanges: true,
                                    changeSet: [this.content]
                                };
                            };
                        
                            // _leak & _seal are called only by onChange
                        
                            Cell.prototype._leak = function(id) {
                                BaseCell.prototype._leak.apply(this, [id]);
                        
                                if (this.usersCount===1) {
                                    DAG.addNode(this);
                                }
                            };
                        
                            Cell.prototype._seal = function(id) {
                                BaseCell.prototype._seal.apply(this, [id]);
                        
                                if (this.usersCount===0) {
                                    DAG.removeNode(this);
                                }
                            };
                        
                            // gets
                        
                            Cell.prototype.hasValue = function() {
                                tracker.track(this);
                        
                                return !this.content.isEmpty();
                            };
                        
                            Cell.prototype.unwrap = function(alt) {
                                tracker.track(this);
                        
                                if (arguments.length==0 && this.content.isEmpty()) {
                                    throw new EmptyError();
                                }
                                return this.content.isEmpty() ? alt : this.content.value();
                            };
                        
                            // internals
                        
                            Cell.prototype._update = function(value, event) {
                                if (this.content.isEqualTo(value)) return false;
                        
                                this.content = value;
                                if (this.usersCount>0) {
                                    this._putEventToDependants(event);
                                    event_broker.notify(this);
                                }
                                return true;
                            };
                        }
                        
                    }
                },
                {
                    path: ["tng","reactive","DependentCell"],
                    content: function(root, expose) {
                        expose(DependentCell, function(){
                            Matter = root.tng.Matter;
                            Node = root.tng.dag.Node;
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                            event_broker = root.tng.event_broker;
                            tracker = root.tng.tracker;
                            EmptyError = root.tng.reactive.EmptyError;
                            DAG = root.tng.dag.DAG;
                            BaseCell = root.tng.reactive.BaseCell;
                        
                            SetDependentCellPrototype();
                        });
                        
                        var Matter, Node, None, Some, event_broker, tracker, EmptyError, DAG, BaseCell;
                        
                        function DependentCell(f, context) {
                            BaseCell.apply(this, []);
                            this.attach(DependentCell);
                        
                            this.dependants = [];
                            this.users = {};
                            this.usersCount = 0;
                            this.f = f;
                            this.context = context;
                            this.dependencies = null;
                            this.content = null;
                        }
                        
                        function SetDependentCellPrototype() {
                            DependentCell.prototype = new BaseCell();
                        
                            // dependenciesChanged is being called during propagating only (!)
                        
                            DependentCell.prototype.dependenciesChanged = function() {
                                var i;
                                var known = {};
                                for (i=0;i<this.dependencies.length;i++) {
                                    known[this.dependencies[i].nodeId] = this.dependencies[i];
                                }
                        
                                var value, tracked, nova = {};
                                tracker.inScope(function(){
                                    try {
                                        value = new Some(this.f.apply(this.context, []));
                                    } catch (e) {
                                        if (e instanceof EmptyError) {
                                            value = new None();
                                        } else {
                                            throw e;
                                        }
                                    }
                                    tracked = tracker.tracked;
                                }, this);
                        
                                var deleted = [];
                                var added = [];
                                for (i=0;i<tracked.length;i++) {
                                    nova[tracked[i].nodeId] = tracked[i];
                                    if (!known.hasOwnProperty(tracked[i].nodeId)) {
                                        added.push(tracked[i]);
                                    }
                                }
                                for (i=0;i<this.dependencies.length;i++) {
                                    if (!nova.hasOwnProperty(this.dependencies[i].nodeId)) {
                                        deleted.push(this.dependencies[i]);
                                    }
                                }
                        
                                for (i=0;i<deleted.length;i++) {
                                    DAG.removeRelation(deleted[i], this);
                                    deleted[i]._seal(this.nodeId);
                                }
                                for (i=0;i<added.length;i++) {
                                    added[i]._leak(this.nodeId);
                                    DAG.addRelation(added[i], this);
                                }
                        
                                this.dependencies = tracked;
                                this.changed = {};
                        
                                if (this.content.isEmpty() && value.isEmpty()) {
                                    return { hasChanges: false };
                                }
                                if (!this.content.isEmpty() && !value.isEmpty()) {
                                    if (this.content.value() === value.value()) {
                                        return { hasChanges: false };
                                    }
                                }
                                this.content = value;
                                this._putEventToDependants(this.content.isEmpty() ? ["unset"] : ["set", this.content.value()]);
                                event_broker.notify(this);
                        
                                return {
                                    hasChanges: true,
                                    changeSet: [this.content]
                                };
                            };
                        
                            // _leak & _seal are called only by onChange
                        
                            DependentCell.prototype._leak = function(id) {
                                BaseCell.prototype._leak.apply(this, [id]);
                        
                                if (this.usersCount===1) {
                                    tracker.inScope(function(){
                                        try {
                                            this.content = new Some(this.f.apply(this.context, []));
                                        } catch (e) {
                                            if (e instanceof EmptyError) {
                                                this.content = new None();
                                            } else {
                                                throw e;
                                            }
                                        }
                                        this.dependencies = tracker.tracked;
                                    }, this);
                        
                                    DAG.addNode(this);
                                    for (var i=0;i<this.dependencies.length;i++) {
                                        this.dependencies[i]._leak(this.nodeId);
                                        DAG.addRelation(this.dependencies[i], this);
                                    }
                                }
                            };
                        
                            DependentCell.prototype._seal = function(id) {
                                BaseCell.prototype._seal.apply(this, [id]);
                        
                                if (this.usersCount===0) {
                                    for (var i=0;i<this.dependencies.length;i++) {
                                        DAG.removeRelation(this.dependencies[i], this);
                                        this.dependencies[i]._seal(this.nodeId);
                                    }
                                    DAG.removeNode(this);
                                    this.dependencies = null;
                                    this.content = null;
                                }
                            };
                        
                            // gets
                        
                            DependentCell.prototype.hasValue = function() {
                                var marker = {};
                                return this.unwrap(marker) !== marker;
                            };
                        
                            DependentCell.prototype.unwrap = function(alt) {
                                tracker.track(this);
                        
                                var args = arguments.length==0 ? [] : [alt];
                        
                                var value = this.content;
                                if (this.usersCount===0) {
                                    value = tracker.outScope(function(){
                                        try {
                                            return new Some(this.f.apply(this.context, []));
                                        } catch (e) {
                                            if (e instanceof EmptyError) {
                                                return new None();
                                            } else {
                                                throw e;
                                            }
                                        }
                                    }, this);
                                }
                        
                                return unwrap.apply(value, args);
                            };
                        
                            function unwrap(alt) {
                                if (arguments.length==0 && this.isEmpty()) {
                                    throw new Error();
                                }
                                return this.isEmpty() ? alt : this.value();
                            }
                        }
                    }
                },
                {
                    path: ["tng","reactive","EmptyError"],
                    content: function(root, expose) {
                        expose(EmptyError);
                        
                        function EmptyError() {
                        }
                        
                    }
                },
                {
                    path: ["tng","reactive","algebra","GroupReducer"],
                    content: function(root, expose) {
                        expose(GroupReducer, function() {
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                        });
                        
                        var None, Some;
                        
                        function GroupReducer(monoid, wrap, ignoreUnset) {
                            this.monoid = monoid;
                            this.wrap = wrap;
                            this.ignoreUnset = ignoreUnset;
                        
                            this.sum = monoid.identity();
                            this.value = new Some(this.sum);
                        
                            this.info = {};
                            this.blocks = 0;
                        }
                        
                        GroupReducer.prototype.add = function(key, value) {
                            if (this.info.hasOwnProperty(key)) {
                                throw new Error();
                            }
                            var info = {
                                blocked: value.isEmpty(),
                                last: value.isEmpty() ? this.monoid.identity() : this.wrap(value.value())
                            };
                            this.info[key] = info;
                            this.sum = this.monoid.add(this.sum, info.last);
                        
                            if (info.blocked) {
                                this.blocks++;
                            }
                        
                            if (this.blocks==0) {
                                this.value = new Some(this.sum);
                            } else if (this.blocks==1) {
                                this.value = new None();
                            }
                        };
                        
                        GroupReducer.prototype.update = function(key, value) {
                            this.remove(key);
                            this.add(key, value);
                        };
                        
                        GroupReducer.prototype.remove = function(key) {
                            if (!this.info.hasOwnProperty(key)) {
                                throw new Error();
                            }
                            var info = this.info[key];
                            delete this.info[key];
                        
                            this.sum = this.monoid.add(this.sum, this.monoid.invert(info.last));
                        
                            if (info.blocked) {
                                this.blocks--;
                            }
                        
                            if (this.blocks==0) {
                                this.value = new Some(this.sum);
                            }
                        };
                    }
                },
                {
                    path: ["tng","reactive","algebra","Reducer"],
                    content: function(root, expose) {
                        expose(Reducer, function() {
                            None = root.adt.maybe.None;
                            Some = root.adt.maybe.Some;
                        });
                        
                        var None, Some;
                        
                        function Reducer(monoid, wrap, ignoreUnset) {}
                        
                        Reducer.prototype.add = function(key, value) {
                        
                        };
                        
                        Reducer.prototype.update = function(key, value) {
                        
                        };
                        
                        Reducer.prototype.remove = function(key) {
                        
                        };
                    }
                },
                {
                    path: ["tng","reactive","lists","BaseList"],
                    content: function(root, expose) {
                        expose(BaseList, function() {
                            uid = root.idgenerator;
                            event_broker = root.tng.event_broker;
                            Matter = root.tng.Matter;
                            AggregatedCell = root.tng.reactive.AggregatedCell;
                            GroupReducer = root.tng.reactive.algebra.GroupReducer;
                        
                        });
                        
                        var uid, event_broker, Matter, AggregatedCell, GroupReducer;
                        
                        function BaseList() {
                            root.tng.Matter.apply(this, []);
                            root.tng.dag.Node.apply(this, []);
                            this.attach(BaseList);
                        
                            this.dependants = [];
                            this.data = [];
                            this.users = {};
                            this.usersCount = 0;
                        }
                        
                        BaseList.prototype.sendAllMessages = function() {
                            for (var i=0;i<this.dependants.length;i++) {
                                this.sendItsMessages(this.dependants[i]);
                            }
                        };
                        
                        BaseList.prototype.sendItsMessages = function(dependant) {
                            if (dependant.disabled) return;
                            if (dependant.mailbox.length==0) return;
                            var event = dependant.mailbox[dependant.mailbox.length - 1];
                            dependant.mailbox = [];
                            dependant.f(this, event);
                        };
                        
                        BaseList.prototype.onEvent = function(f) {
                            if (!event_broker.isOnProcessCall) {
                                return event_broker.invokeOnProcess(this, this.onEvent, [f]);
                            }
                        
                            this._leak(this.nodeId);
                        
                            var self = this;
                        
                            var dependant = {
                                key: uid(),
                                f: function(list, event) {
                                    if (this.disposed) return;
                                    f(event);
                                },
                                disposed: false,
                                mailbox: [ ["reset", this.data.slice()] ]
                            };
                        
                            this.dependants.push(dependant);
                        
                            if (this.usersCount > 0) {
                                event_broker.notifySingle(this, dependant);
                            }
                        
                            return function() {
                                if (dependant.disposed) return;
                                self._seal(self.nodeId);
                                dependant.disposed = true;
                                self.dependants = self.dependants.filter(function(d) {
                                    return d.key != dependant.key;
                                });
                            };
                        };
                        
                        BaseList.prototype._leak = function(id) {
                            if (!this.users.hasOwnProperty(id)) {
                                this.users[id] = 0;
                            }
                            this.users[id]++;
                            this.usersCount++;
                        };
                        
                        BaseList.prototype._seal = function(id) {
                            if (!this.users.hasOwnProperty(id)) {
                                throw new Error();
                            }
                            if (this.users[id]===0) {
                                throw new Error();
                            }
                            this.users[id]--;
                            this.usersCount--;
                            if (this.users[id]===0) {
                                delete this.users[id];
                            }
                        };
                        
                        BaseList.prototype._putEventToDependants = function(event) {
                            for (var i=0;i<this.dependants.length;i++) {
                                this.dependants[i].mailbox.push(event);
                            }
                        };
                        
                        
                        BaseList.prototype.reduceGroup = function(group, opt) {
                            if (!opt) opt = {};
                            if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
                            if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
                            if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;
                        
                            return new AggregatedCell(this, GroupReducer, group, opt.wrap, opt.unwrap, opt.ignoreUnset);
                        };
                        
                    }
                },
                {
                    path: ["tng","reactive","lists","LiftedList"],
                    content: function(root, expose) {
                        expose(LiftedList, function(){
                            BaseList = root.tng.reactive.lists.BaseList;
                        
                            SetLiftedPrototype();
                        });
                        
                        var BaseList;
                        
                        function LiftedList(source, f) {
                            BaseList.apply(this);
                            this.attach(LiftedList);
                        
                            this.source = source;
                            this.f = f;
                        }
                        
                        function SetLiftedPrototype() {
                            LiftedList.prototype = new BaseList();
                        
                            LiftedList.prototype.dependenciesChanged = function() {
                                if (this.source.delta==null) throw new Error();
                                this.delta = liftDelta(this.source.delta, this.f);
                                return true;
                            };
                        
                            LiftedList.prototype.unwrap = function() {
                                if (this.usersCount > 0) {
                                    return this._latest();
                                } else {
                                    return this.source.unwrap().map(function(item){
                                        return this.f(item);
                                    }.bind(this));
                                }
                            };
                        
                            LiftedList.prototype.leak = function() {
                                var id = arguments.length==0 ? this.nodeId : arguments[0];
                        
                                if (!event_broker.isOnProcessCall) {
                                    event_broker.invokeOnProcess(this, this.leak, [id]);
                                    return;
                                }
                        
                                BaseList.prototype._leak.apply(this, [id]);
                        
                                if (this.usersCount===1) {
                                    if (this.delta != null) throw new Error();
                        
                                    this.source.leak(this.nodeId);
                                    this.data = liftData(this.source.data, this.f);
                                    this.delta = liftDelta(this.source.delta, this.f);
                        
                                    DAG.addNode(this);
                                    DAG.addRelation(this.source, this);
                                    event_broker.emitIntroduced(this);
                                }
                            };
                        
                            LiftedList.prototype.seal = function() {
                                var id = arguments.length==0 ? this.nodeId : arguments[0];
                        
                                BaseList.prototype._seal.apply(this, [id]);
                        
                                if (this.usersCount===0) {
                                    DAG.removeRelation(this.source, this);
                                    this.source.seal(this.nodeId);
                                    DAG.removeNode(this);
                                }
                            };
                        
                            function liftDelta(delta, f) {
                                if (delta==null) return null;
                        
                                var result = {
                                    root: null,
                                    added: [],
                                    removed: []
                                };
                        
                                if (delta.root != null) {
                                    result.root = liftData(delta.root, f);
                                }
                        
                                for (var i=0;i<delta.added.length;i++) {
                                    result.added.push({
                                        key: delta.added[i].key,
                                        value: f(delta.added[i].value)
                                    })
                                }
                        
                                result.removed = delta.removed.slice();
                                return result;
                            }
                        
                            function liftData(data, f) {
                                var result = [];
                                for (var i=0;i<data.length;i++) {
                                    result.push({
                                        key: data[i].key,
                                        value: f(data[i].value)
                                    })
                                }
                                return result;
                            }
                        }
                    }
                },
                {
                    path: ["tng","reactive","lists","List"],
                    content: function(root, expose) {
                        expose(List, function(){
                            BaseList = root.tng.reactive.lists.BaseList;
                            uid = root.idgenerator;
                            event_broker = root.tng.event_broker;
                            DAG = root.tng.dag.DAG;
                        
                            SetListPrototype();
                        });
                        
                        var uid, BaseList, DAG, event_broker;
                        
                        function List(data) {
                            BaseList.apply(this);
                            this.attach(List);
                        
                            this.changeSet = [];
                            this._setData(data || []);
                        }
                        
                        function SetListPrototype() {
                            List.prototype = new BaseList();
                        
                            // add, remove, setData are being called only outside of propagating
                        
                            List.prototype.add = function(f) {
                                var key = uid();
                                event_broker.postponeChange(this, ["add", key, f]);
                                return key;
                            };
                        
                            List.prototype.remove = function(key) {
                                event_broker.postponeChange(this, ["remove", key]);
                            };
                        
                            List.prototype.setData = function(data) {
                                event_broker.postponeChange(this, ["setData", data]);
                            };
                        
                            List.prototype.applyChange = function(change) {
                                if (change[0]==="add") {
                                    return this._add(change[1],change[2]);
                                } else if (change[0]==="remove") {
                                    return this._remove(change[1]);
                                } else if (change[0]==="setData") {
                                    return this._setData(change[1]);
                                } else {
                                    throw new Error();
                                }
                            };
                        
                            // dependenciesChanged is being called during propagating only (!)
                        
                            List.prototype.dependenciesChanged = function() {
                                var info = {
                                    hasChanges: this.changeSet.length > 0,
                                    changeSet: this.changeSet
                                };
                                this.changeSet = [];
                                return info;
                            };
                        
                            // may be called during propagating or outside it
                        
                            List.prototype._leak = function(id) {
                                BaseList.prototype._leak.apply(this, [id]);
                        
                                if (this.usersCount===1) {
                                    DAG.addNode(this);
                                }
                            };
                        
                            List.prototype._seal = function(id) {
                                BaseList.prototype._seal.apply(this, [id]);
                        
                                if (this.usersCount===0) {
                                    DAG.removeNode(this);
                                }
                            };
                        
                            // gets
                        
                            List.prototype.unwrap = function() {
                                return this.data.map(function(item){
                                    return item.value;
                                });
                            };
                        
                            // internal
                        
                            List.prototype._add = function(key, f) {
                                if (typeof(f) != "function") {
                                    var item = f;
                                    f = function(id) { return item; };
                                }
                        
                                var value = {key: key, value: f(key)};
                                this.data.push(value);
                        
                                if (this.usersCount>0) {
                                    var event = ["add", value];
                                    this.changeSet.push(event);
                                    this._putEventToDependants(event);
                                    event_broker.notify(this);
                                }
                                return true;
                            };
                        
                            List.prototype._remove = function(key) {
                                this.data = this.data.filter(function(item) {
                                    return item.key != key;
                                });
                        
                                if (this.usersCount>0) {
                                    var event = ["remove", key];
                                    this.changeSet.push(event);
                                    this._putEventToDependants(event);
                                    event_broker.notify(this);
                                }
                        
                                return true;
                            };
                        
                            List.prototype._setData = function(data) {
                                this.data = data.map(function(item){
                                    return {
                                        key: uid(),
                                        value: item
                                    }
                                });
                                if (this.usersCount>0) {
                                    var event = ["reset", data.slice()];
                                    this.changeSet.push(event);
                                    this._putEventToDependants(event);
                                    event_broker.notify(this);
                                }
                        
                                return true;
                            };
                        }
                        
                        List.handler = function(handlers) {
                            return function(e) {
                                while(true) {
                                    if (e[0]==="reset") break;
                                    if (e[0]==="add") break;
                                    if (e[0]==="remove") break;
                                    throw new Error();
                                }
                                handlers[e[0]].call(handlers, e[1]);
                            };
                        };
                    }
                },
                {
                    path: ["tng","tracker"],
                    content: function(root, expose) {
                        expose(new Tracker());
                        
                        function Tracker() {
                            this.active = false;
                        }
                        
                        Tracker.prototype.track = function(cell) {
                            if (!this.active) return;
                            // TODO: optimize
                            if (this.tracked.indexOf(cell)>=0) return;
                            this.tracked.push(cell);
                        };
                        
                        Tracker.prototype.inScope = function(fn, context) {
                            this.active = true;
                            this.tracked = [];
                            try {
                                return fn.apply(context, []);
                            } finally {
                                this.active = false;
                                this.tracked = null;
                            }
                        };
                        
                        Tracker.prototype.outScope = function(fn, context) {
                            var active = this.active;
                            this.active = false;
                            try {
                                return fn.apply(context, []);
                            } finally {
                                this.active = active;
                            }
                        };
                        
                    }
                },
                {
                    path: ["ui","Component"],
                    content: function(root, expose) {
                        expose(Component);
                        
                        function Component(builder) {
                            this.type = Component;
                        
                            this.builder = builder;
                        }
                        
                    }
                },
                {
                    path: ["ui","ast","Component"],
                    content: function(root, expose) {
                        expose(Component);
                        
                        function Component() {
                            this.type = Component;
                        }
                        
                        Component.prototype.dispose = function() {};
                    }
                },
                {
                    path: ["ui","ast","Element"],
                    content: function(root, expose) {
                        expose(Element, function(){
                            jq = root.ui.jq;
                            Cell = root.reactive.Cell;
                            register = root.ui.attributes.register;
                        });
                        
                        var jq, Cell, register;
                        
                        var id = 0;
                        
                        function Element(tag) {
                            this.type = Element;
                        
                            this.tag = tag;
                            this.events = {};
                            this.children = [];
                            this.attributes = {};
                            this.css = {};
                            this.onDraw = [];
                        
                            this.elementId = "warp9/" + (id++);
                        
                            this.disposes = [];
                            this.cells = {};
                            this.dispose = function() {
                                this.disposes.forEach(function(x) { x(); });
                        
                                this.dispose = function() { throw new Error(); }
                            };
                        
                            this.view = function() {
                                var view = document.createElement(tag);
                        
                                for (var name in this.attributes) {
                                    if (!this.attributes.hasOwnProperty(name)) continue;
                                    var setter = register.findAttributeSetter(this.tag, name);
                                    this.disposes.push(setter.apply(name, this, view, this.attributes[name]));
                                }
                        
                                for (var name in this.events) {
                                    if (!this.events.hasOwnProperty(name)) continue;
                                    (function(name){
                                        view.addEventListener(name, function(event) {
                                            this.events[name](this, view, event);
                                        }.bind(this), false);
                                    }.bind(this))(name);
                                }
                        
                                for (var name in this.css) {
                                    if (!this.css.hasOwnProperty(name)) continue;
                                    // TODO: unnecessary condition?!
                                    if (name.indexOf("warp9:")==0) continue;
                                    (function(name, value){
                                        if (typeof value==="object" && value.type == Cell) {
                                            this.cells[value.cellId] = value;
                                            var unsubscribe = value.onEvent(Cell.handler({
                                                set: function(e) { jq.css(view, name, e); },
                                                unset: function() { jq.css(view, name, null); }
                                            }));
                                            value.leak(this.elementId);
                                            this.disposes.push(function(){
                                                unsubscribe();
                                                value.seal(this.elementId);
                                            }.bind(this));
                                        } else {
                                            jq.css(view, name, value);
                                        }
                                    }.bind(this))(name, this.css[name]);
                                }
                        
                                this.view = function() {
                                    throw new Error();
                                };
                        
                                return view;
                            };
                        }
                        
                    }
                },
                {
                    path: ["ui","ast","Fragment"],
                    content: function(root, expose) {
                        expose(Fragment);
                        
                        function Fragment(html) {
                            this.type = Fragment;
                            this.dispose = function() {};
                            this.children = [];
                            this.events = {};
                            this.cells = {};
                            this.css = {};
                            this.onDraw = [];
                            this.view = function() {
                                this.view = function() {
                                    throw new Error();
                                };
                        
                                return html;
                            };
                        }
                    }
                },
                {
                    path: ["ui","ast","TextNode"],
                    content: function(root, expose) {
                        expose(TextNode);
                        
                        function TextNode(text) {
                            this.type = TextNode;
                            this.dispose = function() {};
                            this.children = [];
                            this.onDraw = [];
                            this.css = {};
                            this.events = {};
                            this.cells = {};
                            this.view = function() {
                                var view = document.createTextNode(text);
                        
                                this.view = function() {
                                    throw new Error();
                                };
                        
                                return view;
                            };
                        }
                    }
                },
                {
                    path: ["ui","attributes","AttributeSetter"],
                    content: function(root, expose) {
                        expose(AttributeSetter);
                        
                        function AttributeSetter() {
                            this.type = AttributeSetter;
                        }
                        
                        // returns dispose
                        AttributeSetter.prototype.apply = function(attribute, element, view, value) {
                            throw new Error();
                        };
                        
                    }
                },
                {
                    path: ["ui","attributes","CelledAttributeSetter"],
                    content: function(root, expose) {
                        expose(CelledAttributeSetter, function(){
                            AttributeSetter = root.ui.attributes.AttributeSetter;
                            Cell = root.reactive.Cell;
                        });
                        
                        var AttributeSetter, Cell;
                        
                        function CelledAttributeSetter(template) {
                            AttributeSetter.apply(this, []);
                            this._template = template;
                        }
                        
                        CelledAttributeSetter.prototype.apply = function(attribute, element, view, value) {
                            if (Cell.instanceof(value)) {
                                var self = this;
                                value.leak(element.elementId);
                                var dispose = value.onEvent(Cell.handler({
                                    set: function(value) {
                                        self._template.set(view, value);
                                    },
                                    unset: function() {
                                        self._template.unset(view);
                                    }
                                }));
                                return function() {
                                    dispose();
                                    value.seal(element.elementId);
                                };
                            } else {
                                this._template.set(view, value);
                                return function() {};
                            }
                        };
                    }
                },
                {
                    path: ["ui","attributes","DefaultAttributeSetter"],
                    content: function(root, expose) {
                        expose(DefaultAttributeSetter, function(){
                            jq = root.ui.jq;
                            AttributeSetter = root.ui.attributes.AttributeSetter;
                            Cell = root.reactive.Cell;
                        });
                        
                        var AttributeSetter, jq, Cell;
                        
                        function DefaultAttributeSetter() {
                            AttributeSetter.apply(this, []);
                        }
                        
                        DefaultAttributeSetter.prototype.apply = function(attribute, element, view, value) {
                            if (Cell.instanceof(value)) {
                                value.leak(element.elementId);
                                var dispose = value.onEvent(Cell.handler({
                                    set: function(value) {
                                        view.setAttribute(attribute, value);
                                    },
                                    unset: function() {
                                        view.removeAttribute(attribute);
                                    }
                                }));
                                return function() {
                                    dispose();
                                    value.seal(element.elementId);
                                };
                            } else {
                                view.setAttribute(attribute, value);
                                return function() {};
                            }
                        };
                    }
                },
                {
                    path: ["ui","attributes","common"],
                    content: function(root, expose) {
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
                        
                    }
                },
                {
                    path: ["ui","attributes","register"],
                    content: function(root, expose) {
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
                        
                    }
                },
                {
                    path: ["ui","hacks"],
                    content: function(root, expose) {
                        expose({
                            unrecursion: unrecursion,
                            once: once
                        });
                        
                        // https://gist.github.com/rystsov/5898584
                        // https://code.google.com/p/chromium/issues/detail?id=117307
                        function unrecursion(f) {
                            var active = false;
                            return function() {
                                if (active) return;
                                active = true;
                                f.apply(null, arguments);
                                active = false;
                            };
                        }
                        
                        function once(f) {
                            var called = false;
                            return function() {
                                if (called) return;
                                called = true;
                                f();
                            };
                        }
                    }
                },
                {
                    path: ["ui","jq"],
                    content: function(root, expose) {
                        expose({
                            css: css,
                            removeClass: removeClass,
                            after: after,
                            remove: remove,
                            removeChildren: removeChildren
                        });
                        
                        function css(self, property, value) {
                            var getComputedStyle = document.defaultView.getComputedStyle;
                        
                            if (arguments.length < 3 && typeof property == 'string') {
                                return self.style[camelize(property)] || getComputedStyle(self, '').getPropertyValue(property);
                            }
                        
                            if (!value && value !== 0) {
                                self.style.removeProperty(dasherize(property));
                                return;
                            }
                        
                            self.style.cssText += ';' + dasherize(property) + ":" + value;
                        }
                        
                        function removeClass(self, name) {
                            if (!name) {
                                while (self.classList.length > 0) self.classList.remove(self.classList.item(0));
                            } else {
                                self.classList.remove(name);
                            }
                        }
                        
                        function after(self, element) {
                            self.parentNode.insertBefore(element, self.nextSibling);
                        }
                        
                        function remove(self) {
                            try {
                                self.parentNode.removeChild(self);
                            } catch (e) {
                                throw e;
                            }
                        }
                        
                        function removeChildren(self) {
                            while (self.firstChild) {
                                self.removeChild(self.firstChild);
                            }
                        }
                        
                        
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
                        
                    }
                },
                {
                    path: ["ui","renderer"],
                    content: function(root, expose) {
                        expose({
                            h: h,
                            parse: parse,
                            render: render,
                            addTag: addTag
                        }, function() {
                            Cell = root.reactive.Cell;
                            List = root.reactive.List;
                            Element = root.ui.ast.Element;
                            Component = root.ui.ast.Component;
                            Fragment = root.ui.ast.Fragment;
                            TextNode = root.ui.ast.TextNode;
                            jq = root.ui.jq;
                            hacks = root.ui.hacks;
                            idgenerator = root.idgenerator;
                        
                            addTag("div", root.ui.tags.TagParserFactory("div"));
                            addTag("a", root.ui.tags.TagParserFactory("a"));
                            addTag("section", root.ui.tags.TagParserFactory("section"));
                            addTag("header", root.ui.tags.TagParserFactory("header"));
                            addTag("footer", root.ui.tags.TagParserFactory("footer"));
                            addTag("span", root.ui.tags.TagParserFactory("span"));
                            addTag("strong", root.ui.tags.TagParserFactory("strong"));
                            addTag("h1", root.ui.tags.TagParserFactory("h1"));
                            addTag("ul", root.ui.tags.TagParserFactory("ul"));
                            addTag("li", root.ui.tags.TagParserFactory("li"));
                            addTag("label", root.ui.tags.TagParserFactory("label"));
                            addTag("button", root.ui.tags.TagParserFactory("button"));
                        
                            addTag(root.ui.tags.InputTextParser.TAG, root.ui.tags.InputTextParser);
                            addTag(root.ui.tags.InputCheckParser.TAG, root.ui.tags.InputCheckParser("checkbox"));
                        });
                        
                        var Cell, List, Element, Component, Fragment, TextNode, jq, hacks, idgenerator;
                        
                        var tags = {};
                        
                        function addTag(name, parser) {
                            tags[name] = parser;
                        }
                        
                        function h(element) { return new root.ui.tags.utils.H(element); }
                        
                        function parse(element) {
                            if (typeof element==="string" || element instanceof String) {
                                return new TextNode(element);
                            }
                            if (typeof element==="number") {
                                return new TextNode(element);
                            }
                            if (element instanceof Array) {
                                if (element.length==0) throw new Error();
                                var tag = element[0];
                                if (!(tag in tags)) throw new Error("Unknown tag: " + tag);
                                return tags[tag](element.slice(1));
                            }
                            if (typeof element==="object") {
                                if (element.type==Cell) {
                                    return element.lift(parse);
                                }
                                if (element.type==List) {
                                    return element.lift(parse);
                                }
                                if (element.type==root.ui.Component) {
                                    element = element.builder;
                                }
                            }
                            if (typeof element==="function") {
                                var component = new Component();
                                component.value = parse(element.apply(component, []));
                                return component;
                            }
                            throw new Error();
                        }
                        
                        function render(canvas, element) {
                            var placeToCanvas = function(item) {
                                canvas.appendChild(item);
                            };
                        
                            bindDomTo(placeToCanvas, parse(element));
                        }
                        
                        function bindDomTo(place, dom) {
                            if (dom instanceof Element) {
                                return bindElementTo(place, dom);
                            } else if (dom instanceof Fragment) {
                                return bindElementTo(place, dom);
                            } else if (dom instanceof TextNode) {
                                return bindElementTo(place, dom);
                            } else if (dom instanceof Component) {
                                return bindComponentTo(place, dom);
                            } else if (typeof dom==="object" && dom.type == Cell) {
                                return bindCellTo(place, dom);
                            }
                            throw new Error();
                        }
                        
                        function bindElementTo(place, element) {
                            var html = element.view();
                            var appendToHtml = function(item) {
                                html.appendChild(item);
                            };
                        
                            place(html);
                        
                            if (element.children instanceof Array) {
                                var dispose = [];
                                element.children.forEach(function(dom){
                                    dispose.push(bindDomTo(appendToHtml, dom));
                                });
                                element.onDraw.forEach(function(handler) {
                                    handler(element, html);
                                });
                                return hacks.once(function() {
                                    dispose.forEach(function(f){ f(); });
                                    jq.remove(html);
                                    element.dispose();
                                });
                            } else if (typeof element.children==="object" && element.children.type == List) {
                                var keyDispose = {};
                                var stopChildren = function() {
                                    for (var key in keyDispose) {
                                        if (!keyDispose.hasOwnProperty(key)) continue;
                                        keyDispose[key]();
                                    }
                                    keyDispose = {};
                                };
                                var unsubscribe = element.children.onEvent(List.handler({
                                    data: function(items) {
                                        stopChildren();
                                        items.forEach(this.add);
                                    },
                                    add: function(item) {
                                        keyDispose[item.key] = bindDomTo(appendToHtml, item.value);
                                    },
                                    remove: function(key) {
                                        if (!(key in keyDispose)) throw new Error();
                                        keyDispose[key]();
                                        delete keyDispose[key];
                                    }
                                }));
                                var id = idgenerator();
                                element.children.leak(id);
                                element.onDraw.forEach(function(handler) {
                                    handler(element, html);
                                });
                                return hacks.once(function() {
                                    unsubscribe();
                                    stopChildren();
                                    jq.remove(html);
                                    element.dispose();
                                    element.children.seal(id);
                                });
                            }
                            throw new Error();
                        }
                        
                        function bindCellTo(place, cell) {
                            var mark = document.createElement("script");
                            var placeAfterMark = function(item) {
                                jq.after(mark, item);
                            };
                            place(mark);
                        
                            var clean = function() {};
                            var unsubscribe = cell.onEvent(Cell.handler({
                                set: function(value) {
                                    clean();
                                    clean = bindDomTo(placeAfterMark, value);
                                },
                                unset: function() {
                                    clean();
                                    clean = function() {};
                                }
                            }));
                            var id = idgenerator();
                            cell.leak(id);
                            // TODO: why hacks.once, is it needed?
                            return hacks.once(function() {
                                unsubscribe();
                                clean();
                                cell.seal(id);
                            });
                        }
                        
                        function bindComponentTo(place, component) {
                            var dispose = bindDomTo(place, component.value);
                            return hacks.once(function() {
                                dispose();
                                component.dispose();
                            });
                        }
                    }
                },
                {
                    path: ["ui","tags","InputCheckParser"],
                    content: function(root, expose) {
                        expose(InputCheckParser, function(){
                            Cell = root.reactive.Cell;
                        });
                        
                        var Cell;
                        
                        function InputCheckParser(type) {
                            if (!type) {
                                throw new Error("type must be provided");
                            }
                            if (!(type in {checkbox: 0, radio: 0})) {
                                throw new Error("type must be checkbox or radio");
                            }
                            return function(args) {
                                args = root.ui.tags.args.parse(args);
                                args = root.ui.tags.args.tryIntercept(InputCheckParser.TAG, args);
                        
                                var element = new root.ui.ast.Element("input");
                                element.events = args.events;
                                element.attributes = args.attributes;
                                element.css = args.css;
                                element.onDraw = args.onDraw;
                        
                                var state;
                                if (args.children.length == 0) {
                                    state = new Cell();
                                } else {
                                    if (args.children.length != 1) throw new Error();
                                    if (!Cell.instanceof(args.children[0])) throw new Error();
                                    state = args.children[0];
                                }
                        
                                element.attributes.type = type;
                                element.attributes.checked = state.coalesce(false);
                        
                        
                                var isViewOnly = element.attributes["warp9:role"]==="view";
                                var change = element.events.change || function(){};
                        
                                var changed = element.events["warp9:changed"] || function(){};
                                delete element.events["warp9:changed"];
                                delete element.attributes["warp9:role"];
                        
                                element.events.change = function(control, view) {
                                    change.apply(element.events, [control, view]);
                                    changed(view.checked);
                                    if (!isViewOnly) {
                                        state.set(view.checked);
                                    }
                                };
                        
                                return element;
                            };
                        }
                        
                        InputCheckParser.TAG = "input-check";
                    }
                },
                {
                    path: ["ui","tags","InputTextParser"],
                    content: function(root, expose) {
                        expose(InputTextParser, function() {
                            Cell = root.reactive.Cell;
                        });
                        
                        var Cell;
                        
                        function InputTextParser(args) {
                            args = root.ui.tags.args.parse(args);
                            args = root.ui.tags.args.tryIntercept(InputTextParser.TAG, args);
                        
                            if (args.children.length != 1) {
                                throw new Error();
                            }
                            if (!Cell.instanceof(args.children[0])) {
                                throw new Error();
                            }
                        
                            var element = new root.ui.ast.Element("input");
                            element.events = args.events;
                            element.attributes = args.attributes;
                            element.onDraw = args.onDraw;
                            element.css = args.css;
                            element.attributes.type = "text";
                            element.attributes.value = args.children[0];
                        
                            var input = "input" in element.events ? element.events.input : function(){};
                            element.events.input = function(control, view) {
                                input.apply(element.events, [control, view]);
                                element.attributes.value.set(view.value);
                            };
                        
                            return element;
                        }
                        
                        InputTextParser.TAG = "input-text";
                    }
                },
                {
                    path: ["ui","tags","TagParserFactory"],
                    content: function(root, expose) {
                        expose(TagParserFactory, function(){
                            List = root.reactive.List;
                        });
                        
                        var List;
                        
                        function TagParserFactory(tagName) {
                            return function(args) {
                                args = root.ui.tags.args.parse(args);
                                args = root.ui.tags.args.tryIntercept(tagName, args);
                        
                                var element = new root.ui.ast.Element(tagName);
                                element.events = args.events;
                                element.attributes = args.attributes;
                                element.onDraw = args.onDraw;
                                element.css = args.css;
                        
                                if (args.children.length==1) {
                                    element.children = [root.ui.renderer.parse(args.children[0])];
                                    if (List.instanceof(element.children[0])) {
                                        element.children = element.children[0]
                                    }
                                } else {
                                    element.children = args.children.map(function(child) {
                                        child = root.ui.renderer.parse(child);
                                        if (List.instanceof(child)) throw new Error();
                                        return child;
                                    });
                                }
                        
                                return element;
                            };
                        }
                    }
                },
                {
                    path: ["ui","tags","args"],
                    content: function(root, expose) {
                        expose({
                            parse: parse,
                            tryIntercept: tryIntercept,
                            H: H
                        }, function(){
                            Cell = root.reactive.Cell;
                            List = root.reactive.List;
                            register = root.ui.attributes.register;
                        });
                        
                        var Cell, List, register;
                        
                        function H(element) {
                            this.element = element
                        }
                        
                        function tryIntercept(tag, args) {
                            var interceptors = register.findAttributeInterceptors(tag);
                            for (var i=0;i<interceptors.length;i++) {
                                args = interceptors[i](tag, args);
                            }
                            return args;
                        }
                        
                        function parse(args) {
                            if (args.length==0) throw new Error();
                        
                            var children = [args[0]];
                            var attr = null;
                        
                            while(true) {
                                if (typeof args[0]==="string") break;
                                if (args[0] instanceof Array) break;
                                if (args[0] instanceof Object && args[0].type==Cell) break;
                                if (args[0] instanceof Object && args[0].type==List) break;
                                if (args[0] instanceof H) break;
                                children = [];
                                attr = args[0];
                                break;
                            }
                        
                            for (var i=1;i<args.length;i++) {
                                children.push(args[i]);
                            }
                        
                            if (children.length==1) {
                                if (children[0] instanceof H) {
                                    children = children[0].element;
                                }
                            }
                        
                            var element = normalizeAttributes(attr);
                        
                            var onDraw = [];
                            if (element.events.hasOwnProperty("warp9:draw")) {
                                onDraw.push(element.events["warp9:draw"]);
                                delete element.events["warp9:draw"];
                            }
                        
                            return {
                                events: element.events,
                                onDraw: onDraw,
                                attributes: element.attributes,
                                css: element.css,
                                children: children
                            };
                        }
                        
                        
                        
                        function normalizeAttributes(attr) {
                            var element = {
                                events: {},
                                attributes: {},
                                css: {}
                            };
                            if (attr!=null) {
                                for (var name in attr) {
                                    if (!attr.hasOwnProperty(name)) continue;
                        
                                    if (typeof attr[name]==="function" && name[0]==="!") {
                                        element.events[name.substring(1)] = attr[name];
                                        continue;
                                    }
                                    if (name.indexOf("css/")===0) {
                                        element.css[name.substring(4)] = attr[name];
                                        continue;
                                    }
                                    if (name==="css") {
                                        for (var key in attr[name]) {
                                            if (!attr[name].hasOwnProperty(key)) continue;
                                            element.css[key] = attr[name][key];
                                        }
                                        continue;
                                    }
                                    element.attributes[name] = attr[name];
                                }
                            }
                            return element;
                        }
                        
                    }
                },
                {
                    path: ["utils"],
                    content: function(root, expose) {
                        expose({
                            hashLen: hashLen,
                            hashValues: hashValues,
                            checkBool: checkBool
                        });
                        
                        function checkBool(x) {
                            if (typeof x == "boolean") return x;
                            throw new Error();
                        }
                        
                        function hashLen(hash) {
                            var count = 0;
                            for (var i in hash) {
                                if (!hash.hasOwnProperty(i)) continue;
                                count++;
                            }
                            return count;
                        }
                        
                        function hashValues(hash) {
                            var values = [];
                            for (var i in hash) {
                                if (!hash.hasOwnProperty(i)) continue;
                                values.push(hash[i]);
                            }
                            return values;
                        }
                    }
                }
            ];
        }
    })();
    return warp9;
});