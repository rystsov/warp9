var requirejs = require('requirejs');

requirejs.config({
    baseUrl: __dirname,
    paths: {
        "rere": "."
    },
    nodeRequire: require
});

module.exports = {
    reactive: requirejs("rere/reactive/reactive"),
    adt: requirejs("rere/adt/adt")
};
