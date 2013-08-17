import os
import json
import argparse

def collect(dir, prefix, data):
    for file in os.listdir(dir):
        if os.path.isdir(dir + "/" + file):
            path = list(prefix)
            path.append(file)
            collect(dir + "/" + file, path, data)
        if os.path.isfile(dir + "/" + file):
            if file[-3:] == ".js":
                with open(dir + "/" + file) as content:
                    path = list(prefix)
                    path.append(file[0:-3])
                    data.append((path, content.read()))

def printfile(module, file, usecomma):
    module.write("        {\n")
    module.write("            path: %s,\n" % json.dumps(file[0]))
    module.write("            content: function(root, expose) {\n")
    for line in file[1].split("\n"):
        module.write("                " + line + "\n")
    module.write("            }\n")
    module.write("        }" + (",\n" if usecomma else "\n"))

def printmodule(module, name, data):
    module.write("var %s = (function(){\n" % name)
    module.write("    var files = [\n")
    for i in range(0,len(data)):
        printfile(module, data[i], data[i]!=data[-1])
    module.write("    ];")
    module.write("""    var library = {};
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
})();""")

parser = argparse.ArgumentParser(description='Yet Another js Module Definition.')
parser.add_argument('path', help="path to a folder containing library's files")
parser.add_argument('-c', dest='withcommon', action='store_const',
    const=True, default=False,
    help='generate with a common.js module (none by default)')
args = parser.parse_args()

data = []
collect(args.path,[],data)
if len(data)==0:
    raise Exception("There are no files to concat")
name = os.path.split(args.path)[1]

if args.withcommon:
    with open(name + ".common.js","w") as module:
        printmodule(module, name, data)
        module.write("module.exports = %s;\n" % name)
else:
    with open(name + ".js","w") as module:
        printmodule(module, name, data)
