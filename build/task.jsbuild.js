/**
 * Copyright 2014 GetHuman LLC
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

    var custom = ['jsbuild.common'];
    var tasks = {
        libs: function () {
            return jsStreams.generateLibJs(gulp, opts)
                .pipe(gulp.dest(distJs));
        },
        common: function () {
            return jsStreams.generateCommonJs(gulp, opts)
                .pipe(gulp.dest(distJs));
        },
        '': ['jsbuild.libs', 'jsbuild.custom']
    };

    _.each(opts.appConfigs, function (appConfig, appName) {
        var appTaskName = 'jsbuild.' + appName;

        if (appName !== 'common') {
            custom.push(appTaskName);
            tasks[appName] = function () {
                jsStreams.generateAppJs(appName, gulp, opts)
                    .pipe(gulp.dest(distJs));
            };
        }
    });

    // this task is used during watch when common changes to update common + all the app files
    tasks.custom = custom;

    return tasks;
};

