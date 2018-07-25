/*global module:false*/
module.exports = function(grunt) {

    // Helper methods
    function sub (str) {
        return str.replace(/%s/g, LIBRARY_NAME);
    }

    function wrapModules (head, tail) {
        return head.concat(MODULE_LIST).concat(tail);
    }

    var LIBRARY_NAME = 'agentLibrary';

    var MODULE_LIST = [
        sub('src/%s.module.js'),
        sub('src/submodule/%s.submodule.js'),
        sub('src/%s.socket.js'),
        sub('src/%s.agent.js'),
        sub('src/%s.call.js'),
        sub('src/%s.lead.js'),
        sub('src/%s.chat.js'),
        sub('src/%s.logger.js'),
        sub('src/%s.consoleLogger.js')
    ];

    var DIST_HEAD_LIST = [
        sub('src/%s.intro.js'),
        sub('src/notification/*.notification.js'),
        sub('src/request/*.request.js'),
        sub('src/chat/*.request.js'),
        sub('src/chat/*.notification.js'),
        sub('src/stats/*.stats.js'),
        sub('src/model/*.model.js'),
        sub('src/utils/*.js'),
        sub('src/%s.const.js'),
        sub('src/%s.core.js')
    ];

    // This is the same as DIST_HEAD_LIST, just without *.const.js (which is just
    // there UglifyJS conditional compilation).
    var DEV_HEAD_LIST = [
        sub('src/%s.intro.js'),
        sub('src/notification/*.notification.js'),
        sub('src/request/*.request.js'),
        sub('src/chat/*.request.js'),
        sub('src/chat/*.notification.js'),
        sub('src/stats/*.stats.js'),
        sub('src/model/*.model.js'),
        sub('src/utils/*.js'),
        sub('src/%s.core.js')
    ];

    var TAIL_LIST = [
        sub('src/%s.init.js'),
        sub('src/%s.outro.js')
    ];

    // Gets inserted at the top of the generated files in dist/.
    var BANNER = [
        '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
        '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
    ].join('');


    /**
     * Load required Grunt tasks. These are installed based on the versions listed
     * in `package.json` when you do `npm install` in this directory.
     */
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                options: {
                    banner: BANNER
                },
                src: wrapModules(DIST_HEAD_LIST, TAIL_LIST),
                dest: sub('dist/%s.js')
            },
            dev: {
                options: {
                    banner: BANNER
                },
                src: wrapModules(DEV_HEAD_LIST, TAIL_LIST),
                dest: sub('test/%s.js')
            }
        },
        uglify: {
            dist: {
                files: (function () {
                    // Using an IIFE so that the destination property name can be
                    // created dynamically with sub().
                    var obj = {};
                    obj[sub('dist/%s.min.js')] = [sub('dist/%s.js')];
                    return obj;
                } ())
            },
            options: {
                banner: BANNER,
                mangle: false
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        },
        jshint: {
            all_files: [
                'grunt.js',
                sub('src/%s.!(intro|outro|const)*.js')
            ],
            options: {
                curly: true,
                immed: true,
                newcap: true,
                noarg: true,
                sub: true,
                boss: true,
                eqnull: true
            }
        },
        jsdoc : {
            dist : {
                src: ['dist/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },
        compress: {
            dist: {
                options: {
                    mode: 'gzip',
                    pretty: true
                },
                expand: true,
                cwd: 'dist/',
                src: ['**/*.js'],
                dest: 'dist/',
                rename: function(dest, src) {
                    return dest + '/' + src + '.gz';
                }
            }
        }
    });

    grunt.registerTask('default', [
        'jshint',
        'build',
        'karma'
    ]);
    grunt.registerTask('build', [
        'concat:dist',
        'uglify:dist'
    ]);
    grunt.registerTask('test', [
        'jshint',
        'concat:dev',
        'karma'
    ]);
    grunt.registerTask('compile', [
        'test',
        'build',
        'jsdoc',
        'compress:dist'
    ]);

};
