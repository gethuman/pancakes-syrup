
/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 * This is the primary watch used for pancakes based projects
 */
var _ = require('lodash');

module.exports = function (gulp, opts) {
    var tpls = [].concat(opts.tpls || 'app/**/*.html');

    return function () {
        gulp.watch(['app/common/**/*.less'], ['cssbuild']);
        gulp.watch(['app/common/**/*.js', 'dist/tpls/**/*.js'],   ['jsbuild.custom']);
        gulp.watch(['middleware/**/*.js', 'services/**/*.js', 'utils/**/*.js'], ['test']);
        gulp.watch(tpls, ['precompile']);

        _.each(opts.appConfigs, function (appConfig, appName) {
            gulp.watch(['app/' + appName + '/**/*.js'],   ['jsbuild.' + appName]);
            gulp.watch(['app/' + appName + '/**/*.less'], ['cssbuild']);
        });
    };
};