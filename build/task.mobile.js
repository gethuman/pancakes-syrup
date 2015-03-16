/**
 * Author: Jeff Whelpley
 * Date: 2/23/15
 *
 * Mobile tasks
 */
var _           = require('lodash');
var path        = require('path');
var del         = require('del');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var sass        = require('gulp-sass');
var minifyCSS   = require('gulp-minify-css');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };
var jsStreams   = require('./streams.jsbuild');

module.exports = function (gulp, opts) {
    var pancakes = opts.pancakes;
    var mobileDir = opts.mobileDir || 'mobile';
    var assetsDir = opts.assetsDir || 'assets';
    var mobileOpts = _.extend({ isMobile: true }, opts);
    var tasks = {
        layout: [],
        js: [],
        css: [],
        img: [],
        fonts: [],
        assets: [],
        clean: [],
        watch: [],
        maps: [],
        '': ['mobile.assets', 'mobile.img', 'mobile.js', 'mobile.css', 'mobile.fonts', 'mobile.layout', 'mobile.maps']
    };
    var mobileAppRoot, mobileAppDir, appDir;

    _.each(opts.appConfigs, function (appConfig, appName) {

        // skip if not mobile
        if (!appConfig.isMobile) {
            return;
        }

        appDir = 'app/' + appName + '/';
        mobileAppRoot = path.normalize(mobileDir + '/' + appName);
        mobileAppDir = path.normalize(mobileDir + '/' + appName + '/www');

        tasks.layout.push('mobile.layout' + appName);
        tasks.js.push('mobile.js' + appName);
        tasks.css.push('mobile.css' + appName);
        tasks.img.push('mobile.img' + appName);
        tasks.fonts.push('mobile.fonts' + appName);
        tasks.assets.push('mobile.assets' + appName);
        tasks.clean.push('mobile.clean' + appName);
        tasks.watch.push('mobile.watch' + appName);
        tasks.maps.push('mobile.maps' + appName);

        // for layout we are converting a ui component to basic HTML
        tasks['layout' + appName] = function () {
            return gulp.src('app/' + appName + '/layouts/' + appName + '.layout.js')
                .pipe(pancakes({ transformer: 'uipart', htmlOnly: true }))
                .pipe(rename(appName + '.html'))
                .pipe(gulp.dest(mobileAppDir));
        };

        tasks['js' + appName] = function () {
            return streamqueue(objMode,
                jsStreams.generateLibJs(gulp, mobileOpts),
                jsStreams.generateCommonJs(gulp, opts),
                jsStreams.generateAppJs(appName, gulp, opts)
            )
                .pipe(concat(opts.outputPrefix + '.' + appName + '.js'))
                .pipe(gulp.dest(mobileAppDir + '/js'));
        };

        tasks['css' + appName] = function () {
            var outputPrefix = opts.outputPrefix || 'app';
            var appFiles = [
                'app/' + appName + '/styles/*.scss',
                'app/' + appName + '/partials/*.scss',
                'app/' + appName + '/pages/*.scss'
            ];

            gulp.src(appFiles)
                .pipe(sass())
                .pipe(concat(outputPrefix + '.' + appName + '.css'))
                .pipe(minifyCSS())
                .pipe(gulp.dest('./mobile/' + appName + '/www/css'));

        };

        tasks['img' + appName] = function () {
            return gulp.src([assetsDir + '/mobileimg/*'])
                .pipe(gulp.dest(mobileAppDir + '/img'));
        };

        tasks['fonts' + appName] = function () {
            return gulp.src(['node_modules/ionic/release/fonts/*'])
                .pipe(gulp.dest(mobileAppDir + '/fonts'));
        };

        tasks['assets' + appName] = function () {
            return gulp.src([
                appDir + 'config.xml',
                appDir + 'ionic.project',
                appDir + 'package.json'
            ])
                .pipe(gulp.dest(mobileAppRoot));
        };

        tasks['clean' + appName] = function (done) {
            var glob = [mobileAppDir + '/css/*', mobileAppDir + '/js/*', mobileAppDir + '/img/*'];
            del(glob, done);
        };

        tasks['watch' + appName] = function () {
            gulp.watch(['app/' + appName + '/**/*.less'], ['mobile.css' + appName]);
            gulp.watch(['app/' + appName + '/**/*.js'], ['mobile.js' + appName]);
        };

        tasks['maps' + appName] = function () {
            return gulp.src(['node_modules/angular*/*.map', 'node_modules/angular*/angular*.js'])
                .pipe(rename(function (path) {
                    path.dirname = '';
                }))
                .pipe(gulp.dest(mobileAppDir + '/js'));
        };
    });

    return tasks;
};
