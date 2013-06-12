exports.checkObservableList = function(test, a, b) {
    var a = a.getData();
    if (a.length!=b.length) {
        test.equal(a.length, b.length, "Length should be equal");
        return
    }
    for (var i in a) {
        if (a[i].value!=b[i]) {
            test.equal(a[i].value, b[i], "Items @ " + i +  " should be equal");
            return;
        }
    }
    test.ok(true);
}