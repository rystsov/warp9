import os
import json

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

data = []
collect("rerejs",[],data)

data = map(lambda x: "{ path:" +  json.dumps(x[0]) + ", content: function(root, expose) {\n" + x[1] + "\n}\n}", data)

print "[" + ",".join(data) + "];"
