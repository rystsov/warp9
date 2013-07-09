#!/bin/bash

echo 'require(["rere/rere"], function(rere){console.info(rere);});' > rerejs/rere.module.js
nodejs node_modules/requirejs/bin/r.js -o baseUrl=rerejs name=rere.module paths.rere=. out=rere.amd.js optimize=none
rm rerejs/rere.module.js
tail -n +2 rere.amd.js | head -n -4 > .rere.amd.js


cat .rere.amd.js > rere.amd.js


cat << EOF > rere.closure.js
var rere = (function(){

var modules = {};
var cache = {};

function resolve(dependencies) {
    return dependencies.map(function(dependency){
        if (!(dependency in modules)) throw new Error("Unknown module: " + dependency);
        if (!(dependency in cache)) {
            cache[dependency] = modules[dependency].unit.apply(null, resolve(modules[dependency].dependencies));
        }
        return cache[dependency];
    });
}

function define(what, dependencies, unit) {
    if (arguments.length!=3) throw new Error("Bad count of arguments for: " + what);
    if (what in modules) throw new Error("Module \"" + what + "\" already known");
    modules[what] = {
        dependencies: dependencies,
        unit: unit
    };
}

function require(dependencies, app) {
    app.apply(null, resolve(dependencies));
}

EOF
cat .rere.amd.js >> rere.closure.js
cat << EOF >> rere.closure.js

var rere = null;
require(["rere/rere"], function(rr){
    rere = rr;
});
return rere;

EOF
echo "})();" >> rere.closure.js


rm .rere.amd.js
