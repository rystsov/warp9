module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        yamd: {
            to: ["iife", "commonjs", "amd"],
            library: "warp9",
            target: "target"
        },
        nodeunit: {
            all: ["tests/*.js"]
        }
    });

    grunt.loadNpmTasks('yamd');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('default', ["yamd", "nodeunit"]);
};