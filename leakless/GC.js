var GC = exports;

GC.count = function() {
    var memory = {}
    function counter(rv) {
        memory[rv.id] = rv;
        rv._dependants.map(function(dep) {
            dep.dependants.map(counter)
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
            for (var j in rv._dependants[i].dependants) {
                dependants[rv._dependants[i].dependants[j].id] = rv._dependants[i].dependants[j];
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