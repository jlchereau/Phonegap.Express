module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        env: {
            test: { NODE_ENV: 'test' }
        },
        cafemocha: {
            test: {
                src: 'test/*.js',
                options: {
                    ui: 'bdd',
                    reporter: 'spec'
                }
            }
        }
    });

    // Load NpmTasks
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-cafe-mocha');

    // Default task(s).
    grunt.registerTask('test', ['env:test', 'cafemocha:test']);

}