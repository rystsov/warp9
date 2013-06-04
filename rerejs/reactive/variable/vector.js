define(["rere/reactive/Variable"], function(Variable) {
    return {
        "or": function(vector) {
            function getvalue() {
                var value = [];
                for(var i in vector) {
                    value.push(vector[i].value());
                };
                return value;
            }

            var cell = new Variable();
            for(var i in vector) {
                vector[i].subscribe(function(){
                    cell.set(getvalue())
                });
            };
            return cell;
        }
    }
});
