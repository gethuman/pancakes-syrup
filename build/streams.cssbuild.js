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
var sass        = require('gulp-sass');
var replace     = require('gulp-replace');
var buffer      = require('gulp-buffer');
var objMode     = { objectMode: true };

/**
 * Generate the CSS based on the input options
 * @param gulp
 * @param opts
 * @returns {*}
 */
function generateCss(gulp, opts) {
    var timestamp = opts.timestamp || (new Date()).getTime() + '';
    var cssLibs = opts.cssLibs || [];
    var cssCommon = opts.cssCommon || [];
    var outputPrefix = opts.outputPrefix || 'app';
    var rootDir = opts.rootDir;
    var appFiles = [];
    var appLessPaths = [];
    var appRootDir = path.normalize(rootDir + '/app');
    var commonLesPaths = [ path.normalize(appRootDir + '/common/styles') ];
    var appDir;
    var isMobile = false;

    _.each(opts.appConfigs, function (appConfig, appName) {

        // hack for now...if a mobile app, then do something different
        if (appConfig.isMobile && appName !== 'contact') {
            isMobile = true;
        }

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

    if (isMobile) {
        return gulp.src([
            'app/**/styles/*.scss',
            'app/**/partials/*.scss',
            'app/**/pages/*.scss'
        ])
            .pipe(sass())
            .pipe(concat(outputPrefix + '.all.css'));
    }
    else {
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
            .pipe(buffer())
            .pipe(replace(/gh\.eot/g, 'gh.' + timestamp + '.eot'))
            .pipe(replace(/gh\.woff/g, 'gh.' + timestamp + '.woff'))
            .pipe(replace(/gh\.ttf/g, 'gh.' + timestamp + '.ttf'))
            .pipe(replace(/gh\.svg/g, 'gh.' + timestamp + '.svg'));
    }
}

// export functions
module.exports = {
    generateCss: generateCss
};