define([],function() {
return function(rere) {

return {
    era: 0,
    count: function() {
        var memory = {}
        function counter(rv) {
            memory[rv.id] = rv;
            rv.dependants.map(function(dep) {
                dep.dependants.map(counter)
            });
        }
        for (var i=0;i<arguments.length;i++) {
            if (arguments[i].type != rere.reactive.Cell) throw new Error();
            counter(arguments[i]);
        }
        var total = 0;
        for (var i in memory) total+=1;
        return total;
    },
    collect: function() {
        var GC = this;
        function markGarbageCollectUsed(rv, used) {
            rv.era = GC.era;
            rv.isGarbage = true;
            if (rv.isUsed) {
                used.push(rv);
            }
            for (var i in rv.dependants) {
                for (var j in rv.dependants[i].dependants) {
                    markGarbageCollectUsed(rv.dependants[i].dependants[j], used);
                }
            }
        }
        function unGarbageAncestors(rv) {
            if (rv.era==GC.era) return;

            rv.isGarbage = false;
            rv.era = GC.era;
            for (var i in rv.dependanties) {
                unGarbageAncestors(rv.dependanties[i]);
            }
        }
        function cutGarbage(rv) {
            var items = rv.dependants;
            for (var i in items) {
                var item = items[i];

                var isGarbage = item.dependants.length > 0;
                for (var j in item.dependants) {
                    if (!item.dependants[j].isGarbage) {
                        isGarbage = false;
                        break;
                    }
                }
                if (isGarbage) {
                    var id = item.key;
                    item.unsubscribe(function(){
                        rv.dependants = rv.dependants.filter(function(dependant) {
                            return dependant.key!=id;
                        });
                    });
                } else {
                    for (var j in item.dependants) {
                        cutGarbage(item.dependants[j]);
                    }
                }
            }
        }

        var used = [];
        for (var i in arguments) {
            markGarbageCollectUsed(arguments[i], used);
        }
        GC.era++;
        for (var i in used) {
            unGarbageAncestors(used[i])
        }
        for (var i in arguments) {
            cutGarbage(arguments[i]);
        }
    },
    printFullDependencies: function(rv) {
        function collect(rv) {
            var result = {
                name: rv.name(),
                dependants: []
            };
            var dependants = {}
            for (var i in rv.dependants) {
                for (var j in rv.dependants[i].dependants) {
                    dependants[rv.dependants[i].dependants[j].id] = rv.dependants[i].dependants[j];
                }
            }
            for (var i in dependants) {
                result.dependants.push(collect(dependants[i]))
            }
            return result;
        }
        function print(info, offset) {
            console.info(offset + info.name + (info.dependants.length==0 ? "" : ":"))
            info.dependants.map(function(x) { print(x, offset + "  "); })
        }

        print(collect(rv), "");
    }
}

};
});

