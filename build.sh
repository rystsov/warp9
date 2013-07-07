#!/bin/bash

echo 'require(["rere/rere"], function(rere){console.info(rere);})' > rerejs/rere.module.js
nodejs node_modules/requirejs/bin/r.js -o baseUrl=rerejs name=rere.module paths.rere=. out=rere.js optimize=none
rm rerejs/rere.module.js
head -n -2 rere.js > .rere.js
mv .rere.js rere.js
