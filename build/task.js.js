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
        tasks['js.' + appName] = function () {
            jsStreams.generateAppJs(gulp, opts, appName)
                .pipe(gulp.dest(distJs));
        };
    });

    return tasks;
};

