/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * The output of this stream contains the combined CSS for a given project
 */
var _           = require('lodash');
var path        = require('path');
var streamqueue = require('streamqueue');
var concat      = require('gulp-concat');
var less        = require('gulp-less');
var buffer      = require('gulp-buffer');
var objMode     = { objectMode: true };

/**
 * Generate the CSS based on the input options
 * @param gulp
 * @param opts
 * @returns {*}
 */
function generateCss(gulp, opts) {
    var cssLibs = opts.cssLibs || [];
    var cssCommon = opts.cssCommon || [];
    var outputPrefix = opts.outputPrefix || 'app';
    var rootDir = opts.rootDir;
    var appFiles = [];
    var appLessPaths = [];
    var appRootDir = path.normalize(rootDir + '/app');
    var commonLesPaths = [ path.normalize(appRootDir + '/common/styles') ];
    var appDir;

    _.each(opts.appConfigs, function (appConfig, appName) {
        appDir = path.normalize(appRootDir + '/' + appName + '/');
        if (appName !== 'common' && !appConfig.isMobile) {
            appFiles.push('app/' + appName + '/layouts/' + appName + '.layout.less');
            appLessPaths.push(appDir + 'layouts');
            appFiles.push('app/' + appName + '/pages/*.page.less');
            appLessPaths.push(appDir + 'pages');
            appFiles.push('app/' + appName + '/partials/*.partial.less');
            appLessPaths.push(appDir + 'partials');
        }
    });

    return streamqueue(objMode,
        streamqueue(objMode,
            gulp.src(cssLibs)
                .pipe(concat(outputPrefix + '.libs.less'))
                .pipe(less())
                .pipe(buffer()),
            gulp.src(cssCommon)
        )
            .pipe(concat(outputPrefix + '.common.less'))
            .pipe(less({ paths: commonLesPaths }))
            .pipe(buffer()),
        gulp.src(appFiles)
    )
        .pipe(concat(outputPrefix + '.all.less'))
        .pipe(less({ paths: appLessPaths }))
        .pipe(buffer());
}

// export functions
module.exports = {
    generateCss: generateCss
};