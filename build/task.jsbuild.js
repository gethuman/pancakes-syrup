/**
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 *
 */
var _           = require('lodash');
var jsStreams   = require('./streams.jsbuild');

module.exports = function (gulp, opts) {
    var distDir = opts.distDir || 'dist';
    var distJs = './' + distDir + '/js';
    var custom = [];

    var tasks = {
        libs: function () {
            return jsStreams.generateLibJs(gulp, opts)
                .pipe(gulp.dest(distJs));
        },
        common: {
            deps: ['precompile'],
            task: function () {
                return jsStreams.generateCommonJs(gulp, opts)
                    .pipe(gulp.dest(distJs));
            }
        },
        '': ['jsbuild.libs', 'jsbuild.custom']
    };

    _.each(opts.appConfigs, function (appConfig, appName) {
        var appTaskName = 'jsbuild.' + appName;

        if (appName !== 'common') {
            custom.push(appTaskName);
            tasks[appName] = {
                deps: ['precompile'],
                task: function () {
                    jsStreams.generateAppJs(appName, gulp, opts)
                        .pipe(gulp.dest(distJs));
                }
            };
        }
    });

    // this is so you can do jsbuild.custom during watch
    if (custom.length) {
        tasks.custom = custom;
    }

    return tasks;
};

