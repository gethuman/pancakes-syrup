/**
 * Author: Jeff Whelpley
 * Date: 2/23/15
 *
 * Mobile tasks
 */
var _           = require('lodash');
var path        = require('path');
var clean       = require('gulp-clean');
var concat      = require('gulp-concat');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };
var jsStreams   = require('./streams.jsbuild');
var cssStreams  = require('./streams.cssbuild');

module.exports = function (gulp, opts) {
    var mobileDir = opts.mobileDir || 'mobile';
    var assetsDir = opts.assetsDir || 'assets';
    var tasks = {
        js: [],
        css: [],
        img: [],
        clear: [],
        watch: [],
        '': ['mobile.img', 'mobile.js', 'mobile.css']
    };
    var mobileAppDir;

    _.each(opts.appConfigs, function (appConfig, appName) {
        if (appConfig.isMobile) {
            mobileAppDir = path.normalize(mobileDir + '/' + appName + '/www/');

            tasks.js.push('mobile.js' + appName);
            tasks.css.push('mobile.css' + appName);
            tasks.img.push('mobile.img' + appName);
            tasks.clear.push('mobile.clear' + appName);
            tasks.watch.push('mobile.watch' + appName);

            tasks['js' + appName] = function () {
                return streamqueue(objMode,
                    jsStreams.generateCommonJs(gulp, opts),
                    jsStreams.generateAppJs(appName, gulp, opts)
                )
                    .pipe(concat(opts.outputPrefix + '.' + appName + '.js'))
                    .pipe(gulp.dest(mobileAppDir + 'js'));
            };

            tasks['css' + appName] = function () {
                return cssStreams.generateMobileAppCss(appName, gulp, opts)
                    .pipe(gulp.dest(mobileAppDir + 'css'));
            };

            tasks['img' + appName] = function () {
                return gulp.src([assetsDir + '/mobileimg/*'])
                    .pipe(gulp.dest(mobileAppDir + 'img'));
            };

            tasks['clear' + appName] = function () {
                return gulp.src([mobileAppDir + 'css/*', mobileAppDir + 'js/*', mobileAppDir + 'img/*'])
                    .pipe(clean({ read: false}));
            };

            tasks['watch' + appName] = function () {
                gulp.watch(['app/' + appName + '/**/*.less'], ['mobile.css' + appName]);
                gulp.watch(['app/' + appName + '/**/*.js'], ['mobile.js' + appName]);
            };
        }
    });

    return tasks;
};
