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
                    path: ["ui","ast","Element"],
                    content: function(root, expose) {
                        expose(Element);
                        
                        var id = 0;
                        
                        function Element(tag) {
                            var jq = root.ui.jq;
                            var Cell = root.reactive.Cell;
                        
                            this.type = Element;
                            this.tag = tag;
                            this.attributes = {};
                            this.onDraw = [];
                            this.events = {};
                            this.children = [];
                            this.elementId = "warp9/" + (id++);
                        
                            this.attributeSetters = defaultAttributeSetters();
                        
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
                                    if (name=="css") continue;
                                    this.setAttribute(view, name, this.attributes[name])
                                }
                        
                                for (var name in this.events) {
                                    if (!this.events.hasOwnProperty(name)) continue;
                                    (function(name){
                                        if (name == "key:enter") {
                                            view.addEventListener("keypress", function(event) {
                                                if (event.keyCode == 13) {
                                                    this.events[name](this, view, event);
                                                }
                                            }.bind(this), false);
                                        } else {
                                            view.addEventListener(name, function(event) {
                                                this.events[name](this, view, event);
                                            }.bind(this), false);
                                        }
                                    }.bind(this))(name);
                                }
                                if ("css" in this.attributes) {
                                    for (var property in this.attributes["css"]) {
                                        if (!this.attributes["css"].hasOwnProperty(property)) continue;
                                        // TODO: unnecessary condition?!
                                        if (property.indexOf("warp9:")==0) continue;
                                        (function(property, value){
                                            if (typeof value==="object" && value.type == Cell) {
                                                this.cells[value.cellId] = value;
                                                var unsubscribe = value.onEvent(Cell.handler({
                                                    set: function(e) { jq.css(view, property, e); },
                                                    unset: function() { jq.css(view, property, null); }
                                                }));
                                                value.leak(this.elementId);
                                                this.disposes.push(function(){
                                                    unsubscribe();
                                                    value.seal(this.elementId);
                                                }.bind(this));
                                            } else {
                                                jq.css(view, property, value);
                                            }
                                        }.bind(this))(property, this.attributes["css"][property]);
                                    }
                                }
                        
                                this.view = function() {
                                    throw new Error();
                                };
                        
                                return view;
                            };
                            this.setAttribute = function(view, name, value) {
                                var self = this;
                                if (name in this.attributeSetters) {
                                    wrapRv(value, this.attributeSetters[name](view));
                                } else {
                                    wrapRv(value, defaultMap(view, name));
                                }
                        
                                function defaultMap(view, name) {
                                    return {
                                        set: function(v) { view.setAttribute(name, v); },
                                        unset: function() {
                                            if (view.hasAttribute(name)) {
                                                view.removeAttribute(name);
                                            }
                                        }
                                    }
                                }
                        
                                function wrapRv(value, template) {
                                    if (typeof value==="object" && value.type == Cell) {
                                        self.cells[value.cellId] = value;
                                        var unsubscribe = value.onEvent(Cell.handler(template));
                                        value.leak(self.elementId);
                                        self.disposes.push(function(){
                                            unsubscribe();
                                            value.seal(self.elementId);
                                        }.bind(this));
                                    } else {
                                        template.set(value);
                                    }
                                }
                            };
                        }
                        
                        function defaultAttributeSetters() {
                            return {
                                checked: function(view) {
                                    return {
                                        set: function(v) {
                                            view.checked = v;
                                        },
                                        unset: function() {
                                            view.checked = false;
                                        }
                                    };
                                },
                                value: function(view) {
                                    return {
                                        set: function(v) {
                                            if (view.value!=v) view.value = v;
                                        },
                                        unset: function() {
                                            if (view.value!="") view.value = "";
                                        }
                                    };
                                },
                                disabled: function(view) {
                                    return {
                                        set: function(v) {
                                            if (v) {
                                                view.setAttribute("disabled", "")
                                            } else {
                                                if (view.hasAttribute("disabled")) view.removeAttribute("disabled");
                                            }
                                        },
                                        unset: function() {
                                            view.removeAttribute("disabled");
                                        }
                                    };
                                },
                                "class": function(view) {
                                    var jq = root.ui.jq;
                                    return {
                                        set: function(v) {
                                            jq.removeClass(view);
                                            view.classList.add(v);
                                        },
                                        unset: function() {
                                            jq.removeClass(view);
                                        }
                                    };
                                }
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
                        
                            addTag("input-text", root.ui.tags.InputTextParser);
                            addTag("input-check", root.ui.tags.InputCheckParser("checkbox"));
                        });
                        
                        var Cell, List, Element, Fragment, TextNode, jq, hacks, idgenerator;
                        
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
                            return hacks.once(function() {
                                unsubscribe();
                                clean();
                                cell.seal(id);
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
                            if (!(type in {checkbox: 0, radio: 0})) throw new Error("type must be checkbox or radio")
                            return function(args) {
                                args = root.ui.tags.utils.parseTagArgs(args);
                                var state;
                                if (args.children.length == 0) {
                                    state = new Cell();
                                } else {
                                    if (args.children.length != 1) throw new Error();
                                    state = args.children[0];
                                    if (!(typeof state==="object" && state.type==Cell)) throw new Error();
                                }
                        
                                var element = new root.ui.ast.Element("input");
                                var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                                element.events = attr.events;
                                if (element.events.hasOwnProperty("warp9:draw")) {
                                    element.onDraw.push(element.events["warp9:draw"]);
                                    delete element.events["warp9:draw"];
                                }
                        
                                element.attributes = attr.attributes;
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
                        
                    }
                },
                {
                    path: ["ui","tags","InputTextParser"],
                    content: function(root, expose) {
                        expose(InputTextParser);
                        
                        function InputTextParser(args) {
                            var Cell = root.reactive.Cell;
                            args = root.ui.tags.utils.parseTagArgs(args);
                            if (args.children.length != 1) throw new Error();
                            var value = args.children[0];
                            if (!(typeof value==="object" && value.type==Cell)) throw new Error();
                        
                            var element = new root.ui.ast.Element("input");
                            var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                            element.events = attr.events;
                            if (element.events.hasOwnProperty("warp9:draw")) {
                                element.onDraw.push(element.events["warp9:draw"]);
                                delete element.events["warp9:draw"];
                            }
                        
                            element.attributes = attr.attributes;
                        
                            element.attributes.type = "text";
                            element.attributes.value = value;
                            var input = "input" in element.events ? element.events.input : function(){};
                            element.events.input = function(control, view) {
                                input.apply(element.events, [control, view]);
                                value.set(view.value);
                            };
                        
                            return element;
                        }
                        
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
                                args = root.ui.tags.utils.parseTagArgs(args);
                                var element = new root.ui.ast.Element(tagName);
                                var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                                element.events = attr.events;
                                if (element.events.hasOwnProperty("warp9:draw")) {
                                    element.onDraw.push(element.events["warp9:draw"]);
                                    delete element.events["warp9:draw"];
                                }
                        
                                element.attributes = attr.attributes;
                        
                                element.children = [];
                                var hasCollection = false;
                                for (var i in args.children) {
                                    var child = args.children[i];
                                    child = root.ui.renderer.parse(child);
                                    if (typeof child==="object" && child.type == List) {
                                        hasCollection = true;
                                    }
                                    element.children.push(child);
                                }
                                if (hasCollection) {
                                    if (element.children.length>1) throw new Error();
                                    element.children = element.children[0];
                                }
                                return element;
                            };
                        }
                    }
                },
                {
                    path: ["ui","tags","utils"],
                    content: function(root, expose) {
                        expose({
                            parseTagArgs: parseTagArgs,
                            normalizeAttributes: normalizeAttributes,
                            denormalizeAttributes: denormalizeAttributes,
                            tryEnrich: tryEnrich,
                            H: H
                        });
                        
                        function H(element) {
                            this.element = element
                        }
                        
                        function parseTagArgs(args) {
                            var Cell = root.reactive.Cell;
                            var List = root.reactive.List;
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
                        
                            return {attr: attr, children: children};
                        }
                        
                        function tryEnrich(target, supplement) {
                            if (!supplement) return;
                            for(var key in supplement) {
                                if (!supplement.hasOwnProperty(key)) continue;
                                if (key in target) {
                                    if (typeof target[key]==="object") {
                                        if (typeof supplement[key]!=="object") {
                                            throw new Error();
                                        }
                                        tryEnrich(target[key], supplement[key]);
                                    } else {
                                        continue;
                                    }
                                }
                                target[key] = supplement[key];
                            }
                        }
                        
                        function normalizeAttributes(attr) {
                            var element = {
                                events: {},
                                attributes: {}
                            };
                            if (attr!=null) {
                                for (var name in attr) {
                                    if (!attr.hasOwnProperty(name)) continue;
                        
                                    if (typeof attr[name]==="function" && name[0]==="!") {
                                        element.events[name.substring(1)] = attr[name];
                                        continue;
                                    }
                                    if (name.indexOf("css/")===0) {
                                        if (!element.attributes.css) {
                                            element.attributes.css = {};
                                        }
                                        element.attributes.css[name.substring(4)] = attr[name];
                                        continue;
                                    }
                                    if (name==="css") {
                                        if (!element.attributes.css) {
                                            element.attributes.css = {};
                                        }
                                        for (var key in attr[name]) {
                                            if (!attr[name].hasOwnProperty(key)) continue;
                                            element.attributes.css[key] = attr[name][key];
                                        }
                                    }
                                    element.attributes[name] = attr[name];
                                }
                            }
                            return element;
                        }
                        
                        function denormalizeAttributes(attr) {
                            var result = {};
                            for (var attrKey in attr.attributes) {
                                if (!attr.attributes.hasOwnProperty(attrKey)) continue;
                                result[attrKey] = attr.attributes[attrKey];
                            }
                            for (var eventKey in attr.events) {
                                if (!attr.events.hasOwnProperty(eventKey)) continue;
                                result["!"+eventKey] = attr.events[eventKey];
                            }
                            return result;
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