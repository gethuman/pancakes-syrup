/**
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 * Generate the CSS and put it in the dist/css folder
 */
var cssStreams = require('./streams.cssbuild');

module.exports = function (gulp, opts) {
    var distDir = opts.distDir || 'dist';

    return function () {
        return cssStreams.generateCss(gulp, opts)
            .pipe(gulp.dest('./' + distDir + '/css'));
    };
};
