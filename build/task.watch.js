
/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 * This is the primary watch used for pancakes based projects
 */
var _ = require('lodash');

module.exports = function (gulp, opts) {
    return function () {
        gulp.watch(['app/common/**/*.less'], ['css']);
        gulp.watch(['app/common/**/*.js'],   ['js.custom']);
        gulp.watch(['middleware/**/*.js', 'services/**/*.js', 'utils/**/*.js'], ['test']);

        _.each(opts.appConfigs, function (appConfig, appName) {
            gulp.watch(['app/' + appName + '/**/*.js'],   ['js.' + appName]);
            gulp.watch(['app/' + appName + '/**/*.less'], ['css']);
        });
    };
};