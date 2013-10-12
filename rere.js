var rere = (function(){
    var files = [
        {
            path: ["adt", "maybe"],
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
            path: ["reactive", "algebra", "Group"],
            content: function(root, expose) {
                expose(Group);
                
                function Group() {
                    this.identity = function() {
                        throw new Error();
                    };
                    this.add = function(a,b) {
                        throw new Error();
                    };
                    this.invert = function(x) {
                        return x;
                    };
                }
                
            }
        },
        {
            path: ["reactive", "algebra", "ReduceTree"],
            content: function(root, expose) {
                expose(ReduceTree, function(){
                    Cell = root.reactive.Cell;
                });
                
                var Cell;
                
                function ReduceTree(monoid, wrap, unwrap, ignoreUnset) {
                    this.monoid = monoid;
                    this.root = null;
                    this.value = new Cell(unwrap(monoid.identity()));
                    this.keyToIndex = {};
                    this.indexToKey = [];
                    this.blocks = 0;
                    this.keyId = 0;
                
                    this.tryUpdateValue = function() {
                        if (this.blocks === 0) {
                            this.value.set(unwrap(this.root==null ? monoid.identity() : this.root.value));
                        }
                    };
                
                    this.upsert = function(key, value) {
                        value = wrap(value);
                        if (this.keyToIndex.hasOwnProperty(key)) {
                            this.root = this.root.change(this.monoid, this.keyToIndex[key], value);
                        } else {
                            this.keyToIndex[key] = s(this.root);
                            this.indexToKey.push(key);
                            this.root = this.root==null ? Node.leaf(value) : this.root.put(monoid, value);
                            assert(s(this.root) == this.indexToKey.length);
                        }
                        this.tryUpdateValue();
                    };
                
                    this.delete = function(key) {
                        if (!this.keyToIndex.hasOwnProperty(key)) return;
                        if (this.keyToIndex[key]+1 !== this.indexToKey.length) {
                            this.root = this.root.change(this.monoid, this.keyToIndex[key], this.root.peek());
                            var lastKey = this.indexToKey.pop();
                            this.indexToKey[this.keyToIndex[key]] = lastKey;
                            this.keyToIndex[lastKey] = this.keyToIndex[key];
                        } else {
                            this.indexToKey.pop();
                        }
                        this.root = this.root.pop(monoid);
                        delete this.keyToIndex[key];
                        this.tryUpdateValue();
                    };
                
                    this.add = function(value) {
                        var key = this.keyId++;
                        if (typeof value === "object" && value.type === Cell) {
                            var isBlocked = false;
                            var unblock = function() {
                                if (isBlocked) {
                                    isBlocked = false;
                                    this.blocks--;
                                }
                            }.bind(this);
                            var unsubscribe = value.onEvent([this.value], Cell.handler({
                                "set": function(value) {
                                    unblock();
                                    this.upsert(key, value);
                                }.bind(this),
                                "unset": function() {
                                    if (ignoreUnset) {
                                        this.delete(key);
                                    } else if (!isBlocked) {
                                        isBlocked = true;
                                        this.blocks++;
                                        this.value.unset();
                                    }
                                }.bind(this)
                            }));
                            return function(){
                                unsubscribe();
                                unblock();
                                this.delete(key);
                            }.bind(this);
                        } else {
                            this.upsert(key, value);
                            return function() {
                                this.delete(key);
                            }.bind(this);
                        }
                    }
                }
                
                function Node(value, size, left, right) {
                    this.value = value;
                    this.size = size;
                    this.left = left;
                    this.right = right;
                }
                Node.leaf = function(value) {
                    return new Node(value, 1, null, null);
                };
                Node.of = function(monoid, left, right) {
                    return new Node(monoid.add(left.value, right.value), left.size + right.size, left, right);
                };
                
                Node.prototype.change = function(monoid, index, value) {
                    if (index === 0 && this.size === 1) {
                        return Node.leaf(value);
                    }
                    if (index < this.left.size) {
                        return Node.of(monoid, this.left.change(monoid, index, value), this.right);
                    } else {
                        return Node.of(monoid, this.left, this.right.change(monoid, index - this.left.size, value));
                    }
                };
                
                Node.prototype.peek = function() {
                    return this.size === 1 ? this.value : this.right.peek();
                };
                
                Node.prototype.put = function(monoid, value) {
                    assert (s(this.left)>=s(this.right));
                    var left, right;
                    if (s(this.left)==s(this.right)) {
                        left = this;
                        right = Node.leaf(value);
                    } else {
                        left = this.left;
                        right = this.right.put(monoid, value);
                    }
                    return Node.of(monoid, left, right);
                };
                
                Node.prototype.pop = function(monoid) {
                    if (this.size==1) return null;
                    assert (this.right!=null);
                    assert (this.left!=null);
                    var right = this.right.pop(monoid);
                    if (right==null) {
                        return this.left;
                    } else {
                        return Node.of(monoid, this.left, right);
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
            path: ["reactive", "algebra", "Sigma"],
            content: function(root, expose) {
                expose(Sigma, function() {
                    Cell = root.reactive.Cell;
                });
                
                var Cell;
                
                function Sigma(group, wrap, unwrap) {
                    var sum = group.identity();
                    var blocks = 0;
                
                    this.value = new Cell(unwrap(sum));
                
                    this.add = function(value) {
                        if (typeof value === "object" && value.type === Cell) {
                            var last = null;
                            var isBlocked = false;
                            var unsubscribe = value.onEvent([this.value], Cell.handler({
                                "set": function(value) {
                                    if (isBlocked) {
                                        blocks--;
                                        isBlocked = false;
                                    }
                                    if (last!=null) {
                                        sum = group.add(sum, group.invert(last.value));
                                    }
                                    last = { value: wrap(value) };
                                    sum = group.add(sum, last.value);
                                    if (blocks==0) {
                                        this.value.set(unwrap(sum));
                                    }
                                }.bind(this),
                                "unset": function() {
                                    if (!isBlocked) {
                                        isBlocked = true;
                                        blocks++;
                                        this.value.unset();
                                    }
                                }.bind(this)
                            }));
                
                            return function() {
                                unsubscribe();
                                if (last!=null) {
                                    sum = group.add(sum, group.invert(last.value));
                                    last = null;
                                }
                                if (isBlocked) {
                                    blocks--;
                                    isBlocked = false;
                                }
                                if (blocks==0) {
                                    this.value.set(unwrap(sum));
                                }
                            }.bind(this);
                        } else {
                            sum = group.add(sum, wrap(value));
                            this.value.set(unwrap(sum));
                            return function() {
                                sum = group.add(sum, group.invert(value));
                                this.value.set(unwrap(sum));
                            }.bind(this);
                        }
                    };
                }
            }
        },
        {
            path: ["reactive", "Cell"],
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
                
                    this.content = new None();
                    if (arguments.length>0) {
                        this.set(arguments[0])
                    }
                }
                
                function SetCellPrototype() {
                    Cell.prototype = new BaseCell();
                
                    // Common
                    Cell.prototype.onEvent = function(f) {
                        if (this.content.isEmpty()) {
                            f(["unset"]);
                        } else {
                            f(["set", this.content.value()]);
                        }
                        return BaseCell.prototype.onEvent.apply(this, [f]);
                    };
                
                    Cell.prototype.unwrap = function(alt) {
                        if (arguments.length==0 && this.content.isEmpty()) throw new Error();
                        return this.content.isEmpty() ? alt : this.content.value();
                    };
                
                    // Specific
                    Cell.prototype.set = function(value) {
                        this.content = new Some(value)
                        this.raise(["set", value])
                    };
                
                    Cell.prototype.unset = function() {
                        this.content = new None();
                        this.raise(["unset"])
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
            path: ["reactive", "cells", "BaseCell"],
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
                
                BaseCell.prototype.onEvent = function(f) {
                    var id = this.dependantsId++;
                    this.dependants.push({key: id, f:f});
                    return function() {
                        this.dependants = this.dependants.filter(function(dependant) {
                            return dependant.key!=id;
                        });
                    }.bind(this);
                };
                
                BaseCell.prototype.use = function(id) {
                    if (!this.users.hasOwnProperty(id)) {
                        this.users[id] = 0;
                    }
                    this.users[id]++;
                    this.usersCount++;
                };
                
                BaseCell.prototype.leave = function(id) {
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
                
                BaseCell.prototype.unwrap = function() {
                    throw new Error("Not implemented");
                };
                
                BaseCell.prototype.lift = function(f) {
                    return new LiftedCell(this, f);
                };
                
                BaseCell.prototype.coalesce = function(replace) {
                    return new CoalesceCell(this, replace);
                };
                
                BaseCell.prototype.when = function(condition, transform) {
                    var test = typeof condition === "function" ? condition : function(value) {
                        return value === condition;
                    };
                
                    var map = typeof transform === "function" ? transform : function() { return transform; };
                
                    return new WhenCell(test, map);
                };
                
                BaseCell.prototype.bind = function(f) {
                    return new BindedCell(this, f);
                };
                
                BaseCell.prototype.raise = function(e) {
                    this.dependants.forEach(function(d){ d.f(e); });
                };
            }
        },
        {
            path: ["reactive", "cells", "BindedCell"],
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
                
                    BindedCell.prototype.onEvent = function(f) {
                        if (this.usersCount>0) {
                            if (this.content.isEmpty()) {
                                f(["unset"]);
                            } else {
                                f(["set", this.content.value()]);
                            }
                        }
                        return BaseCell.prototype.onEvent.apply(this, [f]);
                    };
                
                    BindedCell.prototype.use = function(id) {
                        BaseCell.prototype.use.apply(this, [id]);
                        if (this.usersCount === 1) {
                            this.source.use(this.cellId);
                            this.unsource = this.source.onEvent(Cell.handler({
                                set: function(value) {
                                    this.unmap();
                                    this.mapped = this.f(value);
                                    if (this.source == this.mapped) {
                                        throw new Error();
                                    }
                                    this.mapped.use(this.cellId);
                                    var dispose = this.mapped.onEvent(Cell.handler({
                                        set: function(value) {
                                            this.content = new Some(value);
                                            this.raise(["set", this.content.value()]);
                                        }.bind(this),
                                        unset: function() {
                                            this.content = new None();
                                            this.raise(["unset"]);
                                        }.bind(this)
                                    }));
                                    this.unmap = function(){
                                        dispose();
                                        this.mapped.leave(this.cellId);
                                        this.mapped = null;
                                        this.unmap = empty;
                                    }.bind(this);
                                }.bind(this),
                                unset: function(){
                                    this.unmap();
                                    this.content = new None();
                                    this.raise(["unset"]);
                                }.bind(this)
                            }));
                        }
                    };
                
                    BindedCell.prototype.leave = function(id) {
                        BaseCell.prototype.leave.apply(this, [id]);
                        if (this.usersCount === 0) {
                            this.unsource();
                            this.unmap();
                            this.unsource = null;
                            this.source.leave(this.cellId);
                        }
                    };
                
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
                }
            }
        },
        {
            path: ["reactive", "cells", "CoalesceCell"],
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
                
                    CoalesceCell.prototype.onEvent = function(f) {
                        if (this.usersCount>0) {
                            if (this.content.isEmpty()) {
                                f(["set", this.replace]);
                            } else {
                                f(["set", this.content.value()]);
                            }
                        }
                        return BaseCell.prototype.onEvent.apply(this, [f]);
                    };
                
                    CoalesceCell.prototype.use = function(id) {
                        BaseCell.prototype.use.apply(this, [id]);
                        if (this.usersCount === 1) {
                            this.source.use(this.cellId);
                            this.unsubscribe = this.source.onEvent(Cell.handler({
                                set: function(value) {
                                    this.content = new Some(value);
                                    this.raise(["set", this.content.value()]);
                                }.bind(this),
                                unset: function(){
                                    this.content = new Some(this.replace);
                                    this.raise(["set", this.content.value()]);
                                }.bind(this)
                            }))
                        }
                    };
                
                    CoalesceCell.prototype.leave = function(id) {
                        BaseCell.prototype.leave.apply(this, [id]);
                        if (this.usersCount === 0) {
                            this.unsubscribe();
                            this.unsubscribe = null;
                            this.source.leave(this.cellId);
                        }
                    };
                
                    CoalesceCell.prototype.unwrap = function() {
                        return this.source.unwrap(this.replace);
                    };
                }
            }
        },
        {
            path: ["reactive", "cells", "LiftedCell"],
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
                
                    LiftedCell.prototype.onEvent = function(f) {
                        if (this.usersCount>0) {
                            if (this.content.isEmpty()) {
                                f(["unset"]);
                            } else {
                                f(["set", this.content.value()]);
                            }
                        }
                        return BaseCell.prototype.onEvent.apply(this, [f]);
                    };
                
                    LiftedCell.prototype.use = function(id) {
                        BaseCell.prototype.use.apply(this, [id]);
                        if (this.usersCount === 1) {
                            this.source.use(this.cellId);
                            this.unsubscribe = this.source.onEvent(Cell.handler({
                                set: function(value) {
                                    this.content = new Some(this.f(value));
                                    this.raise(["set", this.content.value()]);
                                }.bind(this),
                                unset: function(){
                                    this.content = new None();
                                    this.raise(["unset"]);
                                }.bind(this)
                            }))
                        }
                    };
                
                    LiftedCell.prototype.leave = function(id) {
                        BaseCell.prototype.leave.apply(this, [id]);
                        if (this.usersCount === 0) {
                            this.unsubscribe();
                            this.unsubscribe = null;
                            this.source.leave(this.cellId);
                        }
                    };
                
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
                }
            }
        },
        {
            path: ["reactive", "cells", "WhenCell"],
            content: function(root, expose) {
                expose(WhenCell, function(){
                    None = root.adt.maybe.None;
                    Some = root.adt.maybe.Some;
                    Cell = root.reactive.Cell;
                    BaseCell = root.reactive.cells.BaseCell;
                
                    SetWhenPrototype();
                });
                
                var None, Some, Cell, BaseCell;
                
                function WhenCell(source, condition, transform) {
                    this.source = source;
                    this.condition = condition;
                    this.transform = transform;
                    BaseCell.apply(this);
                }
                
                function SetWhenPrototype() {
                    WhenCell.prototype = new BaseCell();
                
                    WhenCell.prototype.onEvent = function(f) {
                        if (this.usersCount>0) {
                            if (this.content.isEmpty()) {
                                f(["unset"]);
                            } else {
                                f(["set", this.content.value()]);
                            }
                        }
                        return BaseCell.prototype.onEvent.apply(this, [f]);
                    };
                
                    WhenCell.prototype.use = function(id) {
                        BaseCell.prototype.use.apply(this, [id]);
                        if (this.usersCount === 1) {
                            this.source.use(this.cellId);
                            this.unsubscribe = this.source.onEvent(Cell.handler({
                                set: function(value) {
                                    if (this.condition(value)) {
                                        this.content = new Some(this.transform(value));
                                        this.raise(["set", this.content.value()]);
                                    } else {
                                        this.content = new None();
                                        this.raise(["unset"]);
                                    }
                                }.bind(this),
                                unset: function(){
                                    this.content = new None();
                                    this.raise(["unset"]);
                                }.bind(this)
                            }))
                        }
                    };
                
                    WhenCell.prototype.leave = function(id) {
                        BaseCell.prototype.leave.apply(this, [id]);
                        if (this.usersCount === 0) {
                            this.unsubscribe();
                            this.unsubscribe = null;
                            this.source.leave(this.cellId);
                        }
                    };
                
                    WhenCell.prototype.unwrap = function() {
                        var marker = {};
                        var value = this.source.unwrap(marker);
                        if (value !== marker) {
                            if (this.condition(value)) {
                                return this.transform(value);
                            }
                        }
                        if (arguments.length === 0) throw new Error();
                        return arguments[0];
                    };
                }
            }
        },
        {
            path: ["reactive", "List"],
            content: function(root, expose) {
                expose(List, function(){
                    BaseList = root.reactive.lists.BaseList;
                    Cell = root.reactive.Cell;
                
                    SetListPrototype();
                });
                
                var BaseList, Cell;
                
                function List(data) {
                    this._elementId = 0;
                    this._count = new Cell(0);
                    BaseList.apply(this);
                
                    this.setData(data);
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
                
                    List.prototype.setData = function(data) {
                        var length = this.data.length;
                        this.data = data.map(function(item){
                            return {
                                key: this._elementId++,
                                value: item
                            }
                        }.bind(this));
                        if (length!=this.data.length) {
                            this._count.set(this.data.length);
                        }
                        this.raise(["data", this.data.slice()]);
                    };
                
                    List.prototype.onEvent = function(f) {
                        f(["data", this.data.slice()]);
                        return BaseList.prototype.onEvent.apply(this, [f]);
                    };
                
                    List.prototype.add = function(f) {
                        if (typeof(f) != "function") throw new Error();
                        var key = this._elementId++;
                        var e = {key: key, value: f(key)};
                        this.data.push(e);
                        this._count.set(this.data.length);
                        this.raise(["add", e]);
                    };
                
                    List.prototype.remove = function(key) {
                        var removed = false;
                        var length = this.data.length;
                        this.data = this.data.filter(function(item){
                            return item.key != key;
                        });
                        if (length!=this.data.length) {
                            this._count.set(this.data.length);
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
                
                    List.prototype.count = function() {
                        if (arguments.length===0) return this._count;
                        return BaseList.prototype.count(arguments[0]);
                    };
                }
                
            }
        },
        {
            path: ["reactive", "lists", "BaseList"],
            content: function(root, expose) {
                expose(BaseList, function() {
                    List = root.reactive.List;
                    Sigma = root.reactive.algebra.Sigma;
                    ReduceTree = root.reactive.algebra.ReduceTree;
                    LiftedList = root.reactive.lists.LiftedList;
                });
                
                var List, Sigma, ReduceTree, LiftedList;
                
                function BaseList() {
                    this.listId = root.idgenerator();
                    this.type = List;
                    this.dependantsId = 0;
                    this.dependants = [];
                    this.users = {};
                    this.usersCount = 0;
                    this.data = [];
                }
                
                BaseList.prototype.onEvent = function(f) {
                    var id = this.dependantsId++;
                    this.dependants.push({key: id, f:f});
                    return function() {
                        this.dependants = this.dependants.filter(function(dependant) {
                            return dependant.key!=id;
                        });
                    }.bind(this);
                };
                
                BaseList.prototype.raise = function(e) {
                    this.dependants.forEach(function(d){ d.f(e); });
                };
                
                BaseList.prototype.use = function(id) {
                    if (!this.users.hasOwnProperty(id)) {
                        this.users[id] = 0;
                    }
                    this.users[id]++;
                    this.usersCount++;
                };
                
                BaseList.prototype.leave = function(id) {
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
                
                BaseList.prototype.reduceGroup = function(group, opt) {
                    if (!opt) opt = {};
                    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
                    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
                
                    var counter = new Sigma(group, opt.wrap, opt.unwrap);
                    initReducer(this, counter);
                    return counter.value;
                };
                
                BaseList.prototype.reduceMonoid = function(monoid, opt) {
                    if (!opt) opt = {};
                    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
                    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
                    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;
                
                    var counter = new ReduceTree(monoid, opt.wrap, opt.unwrap, opt.ignoreUnset);
                    initReducer(this, counter);
                    return counter.value;
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
                        wrap: function(x) { return bool_to(x, [1,1], [0,1]); },
                        unwrap: function(x) { return x[0]==x[1]; }
                    });
                };
                
                BaseList.prototype.count = function() {
                    var predicate = arguments.length===0 ? function() { return true; } : arguments[0];
                
                    return this.lift(function(x){
                        x = predicate(x);
                        if (typeof x === "object" && x.type === Cell) {
                            return x.lift(function(x) { return bool_to(x, 1, 0); });
                        }
                        return bool_to(x, 1, 0);
                    }).reduceGroup({
                        identity: function() { return 0; },
                        add: function(x,y) { return x+y; },
                        invert: function(x) { return -x; }
                    });
                };
                
                BaseList.prototype.lift = function(f) {
                    return new LiftedList(this, f);
                };
                
                
                function initReducer(list, reducer) {
                    var subscribes = {};
                    list.onEvent(List.handler({
                        data: function(e) {
                            for (var i=0;i < e.length;i++) {
                                subscribes[e[i].key] = reducer.add(e[i].value);
                            }
                        },
                        add: function(e) {
                            subscribes[e.key] = reducer.add(e.value);
                        },
                        remove: function(e) {
                            if (e in subscribes) {
                                subscribes[e]();
                                delete subscribes[e];
                            }
                        }
                    }));
                }
                
                function bool_to(x, t, f) {
                    if (x === true) return t;
                    if (x === false) return f;
                    throw new Error();
                }
                
                
            }
        },
        {
            path: ["reactive", "lists", "LiftedList"],
            content: function(root, expose) {
                expose(LiftedList, function(){
                    BaseList = root.reactive.lists.BaseList;
                
                    SetLiftedPrototype();
                });
                
                var BaseList;
                
                function LiftedList(source, f) {
                    this.source = source;
                    this.f = f;
                    BaseList.apply(this);
                }
                
                function SetLiftedPrototype() {
                    LiftedList.prototype = new BaseList();
                
                    LiftedList.prototype.onEvent = function(f) {
                        if (this.usersCount>0) {
                            f(["data", this.data])
                        }
                        return BaseCell.prototype.onEvent.apply(this, [f]);
                    };
                
                    LiftedList.prototype.use = function(id) {
                        BaseList.prototype.use.apply(this, [id]);
                        if (this.usersCount === 1) {
                            this.source.use(this.listId);
                            this.unsubscribe = this.source.onEvent(List.handler({
                                data: function(data) {
                                    this.data = data.map(function(item){
                                        return {key: item.key, value: this.f(item)};
                                    }.bind(this));
                                    this.raise(["data", this.data.slice()]);
                                }.bind(this),
                                add: function(item) {
                                    item = {key: item.key, value: this.f(item)};
                                    this.data.push(item);
                                    this.raise(["add", item]);
                                }.bind(this),
                                remove: function(key){
                                    this.data = this.data.filter(function(item){
                                        return item.key != key;
                                    });
                                    this.raise(["remove", key]);
                                }.bind(this)
                            }))
                        }
                    };
                
                    LiftedList.prototype.leave = function(id) {
                        BaseCell.prototype.leave.apply(this, [id]);
                        if (this.usersCount === 0) {
                            this.unsubscribe();
                            this.unsubscribe = null;
                            this.source.leave(this.listId);
                        }
                    };
                }
            }
        },
        {
            path: ["reactive", "utils"],
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
            path: ["ui", "ast", "Element"],
            content: function(root, expose) {
                expose(Element);
                
                var id = 0;
                
                function Element(tag) {
                    var jq = root.ui.jq;
                    var Cell = root.reactive.Cell;
                
                    this.type = Element;
                    this.tag = tag;
                    this.attributes = {};
                    this.events = {};
                    this.children = [];
                    this.elementId = "rere/ui/ast/element/" + (id++);
                
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
                                if (name == "control:draw") return;
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
                                if (property.indexOf("rere:")==0) continue;
                                (function(property, value){
                                    if (typeof value==="object" && value.type == Cell) {
                                        this.cells[value.id] = value;
                                        this.disposes.push(value.onEvent([], Cell.handler({
                                            set: function(e) { jq.css(view, property, e); },
                                            unset: function() { jq.css(view, property, null); }
                                        })));
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
                                self.cells[value.id] = value;
                                self.disposes.push(value.onEvent([], Cell.handler({
                                    set: template.set,
                                    unset: template.unset
                                })));
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
            path: ["ui", "ast", "Fragment"],
            content: function(root, expose) {
                expose(Fragment);
                
                function Fragment(html) {
                    this.type = Fragment;
                    this.dispose = function() {};
                    this.children = [];
                    this.events = {};
                    this.cells = {};
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
            path: ["ui", "ast", "TextNode"],
            content: function(root, expose) {
                expose(TextNode);
                
                function TextNode(text) {
                    this.type = TextNode;
                    this.dispose = function() {};
                    this.children = [];
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
            path: ["ui", "hacks"],
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
            path: ["ui", "jq"],
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
            path: ["ui", "renderer"],
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
                
                var Cell, List, Element, Fragment, TextNode, jq, hacks;
                
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
                    } else if (dom instanceof Cell) {
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
                        return hacks.once(function() {
                            dispose.forEach(function(f){ f(); });
                            jq.remove(html);
                        });
                    } else if (element.children instanceof List) {
                        var keyDispose = {};
                        var stopChildren = function() {
                            for (var key in keyDispose) {
                                if (!keyDispose.hasOwnProperty(key)) continue;
                                keyDispose[key]();
                            }
                            keyDispose = {};
                        };
                        var unsubscribe = element.children.subscribe(List.handler({
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
                        return hacks.once(function() {
                            unsubscribe();
                            stopChildren();
                            jq.remove(html);
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
                
                    var unsubscribe = cell.onEvent([], Cell.handler({
                        set: function(value) {
                            clean();
                            clean = bindDomTo(placeAfterMark, value);
                        },
                        unset: function() {
                            clean();
                            clean = function() {};
                        }
                    }));
                
                    return hacks.once(function() {
                        unsubscribe();
                        clean()
                    });
                }
            }
        },
        {
            path: ["ui", "tags", "InputCheckParser"],
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
                        element.attributes = attr.attributes;
                        element.attributes.type = type;
                        element.attributes.checked = state.coalesce(false);
                
                        var isViewOnly = element.attributes["rere:role"]==="view";
                        var change = element.events.change || function(){};
                        var checked = element.events["rere:checked"] || function(){};
                        var unchecked = element.events["rere:unchecked"] || function(){};
                        var changed = element.events["rere:changed"] || function(){};
                        delete element.events["rere:checked"];
                        delete element.events["rere:unchecked"];
                        element.events.change = function(control, view) {
                            change.apply(element.events, [control, view]);
                            if (view.checked) {
                                checked();
                            } else {
                                unchecked();
                            }
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
            path: ["ui", "tags", "InputTextParser"],
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
            path: ["ui", "tags", "TagParserFactory"],
            content: function(root, expose) {
                expose(TagParserFactory, function(){
                    List = root.reactive.List;
                });
                
                var List;
                
                function TagParserFactory(tagName) {
                    return function(args) {
                        var args = root.ui.tags.utils.parseTagArgs(args);
                        var element = new root.ui.ast.Element(tagName);
                        var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                        element.events = attr.events;
                        element.attributes = attr.attributes;
                        element.children = [];
                        var hasCollection = false;
                        for (var i in args.children) {
                            var child = args.children[i];
                            child = root.ui.renderer.parse(child);
                            if (child instanceof List) {
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
            path: ["ui", "tags", "utils"],
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
                    hashValues: hashValues
                });
                
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
    ];    var library = {};
    for (var i in files) {
        initModuleStructure(library, library, files[i].path, files[i].content);
    }
    var ctors = [];
    for (var i in files) {
        addModuleContentCollectCtor(library, library, files[i].path, files[i].content, ctors);
    }
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
                content(library, function(obj, ctor) {
                    exposed = obj;
                    throw new ExposeBreak();
                })
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
            content(library, function(obj, ctor) {
                if (ctor) ctors.push(ctor);
                if (typeof obj==="function") {
                    namespace[path[0]] = obj;
                }
                if (typeof obj==="object") {
                    for (var key in obj) {
                        namespace[path[0]][key] = obj[key];
                    }
                }
            });
        }
    }
})();