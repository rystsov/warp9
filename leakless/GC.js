var GC = exports;

GC.count = function() {
    var memory = {}
    function counter(rv) {
        memory[rv.id] = rv;
        rv._dependants.map(function(dep) {
            if (dep.dependant != null) {
                dep.dependant.map(counter)
            }
        });
    }
    for (var i=0;i<arguments.length;i++) {
        if (!arguments[i]._is_rvariable) throw new Error();
        counter(arguments[i]);
    }
    var total = 0;
    for (var i in memory) total+=1;
    return total;
}

GC.printFullDependencies = function(rv) {
    function collect(rv) {
        var result = {
            name: rv.name(),
            dependants: []
        };
        var dependants = {}
        for (var i in rv._dependants) {
            if (rv._dependants[i].dependant==null) continue;
            for (var j in rv._dependants[i].dependant) {
                dependants[rv._dependants[i].dependant[j].id] = rv._dependants[i].dependant[j];
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