define([], function(){
return function(rere){

return {
    oneof: function(buttons) {
        for(var idx in buttons) {
            (function(i){
                buttons[i].onEvent(function(e){
                    if (e[0]==="set" && e[1]===true) {
                        for (var j in buttons) {
                            if (j==i) continue;
                            buttons[j].set(false);
                        }
                    }
                });
            })(idx);
        }
    }
};

};
});
