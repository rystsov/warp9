var requirejs = require('requirejs');

requirejs.config({
    baseUrl: __dirname,
    paths: {
        "rere": "."
    },
    nodeRequire: require
});

module.exports = requirejs("rere/rere");
