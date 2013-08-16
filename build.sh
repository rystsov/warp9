#!/bin/bash

echo "var rere = (function(){" > rere.js
echo -n "    var files = " >> rere.js
python build.py >> rere.js
cat << EOF >> rere.js
    var library = {};
    for (var i in files) {
        initModuleStructure(library, library, files[i].path, files[i].content);
    }
    for (var i in files) {
        addModuleContent(library, library, files[i].path, files[i].content);
    }
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
                content(library, function(obj) {
                    exposed = obj;
                    throw new ExposeBreak();
                })
            } catch (e) {
                if (!(e instanceof ExposeBreak)) throw new Error(e);
            }
            if (exposed!=null) {
                if (typeof exposed==="object") {
                    namespace[path[0]] = {};
                }
            }
        }
        function ExposeBreak() {}
    }
    function addModuleContent(library, namespace, path, content) {
        if (path.length>1) {
            addModuleContent(library, namespace[path[0]], path.slice(1), content);
        }
        if (path.length==1) {
            content(library, function(obj) {
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
EOF

cat rere.js > rere.common.js
echo "module.exports = rere;" >> rere.common.js