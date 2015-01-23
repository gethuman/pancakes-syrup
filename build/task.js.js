/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 *
 */
var _           = require('lodash');
var jsStreams   = require('./streams.js');

module.exports = function (gulp, opts) {
    var distDir = opts.distDir || 'dist';
    var distJs = './' + distDir + '/js';

    if (!opts.pancakes) {
        throw new Error('batter.whip() must include pancakes in opts');
    }

    var custom = ['js.common'];
    var tasks = {
        libs: function () {
            return jsStreams.generateLibJs(gulp, opts)
                .pipe(gulp.dest(distJs));
        },
        common: function () {
            return jsStreams.generateCommonJs(gulp, opts)
                .pipe(gulp.dest(distJs));
        },
        'default': ['js.libs', 'js.common']
    };

    _.each(opts.appConfigs, function (appConfig, appName) {
        var appTaskName = 'js.' + appName;

        custom.push(appTaskName);
        tasks[appTaskName] = function () {
            jsStreams.generateAppJs(appName, gulp, opts)
                .pipe(gulp.dest(distJs));
        };
    });

    // this task is used during watch when common changes to update common + all the app files
    tasks.custom = custom;

    return tasks;
};

