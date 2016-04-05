/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 * Task for moving all static files from assets to dist
 */
var rename = require('gulp-rename');

module.exports = function (gulp, opts) {
    var distDir = './' + (opts.distDir || 'dist') + '/';
    var assetsDir = opts.assetsDir || 'assets';
    var jsAssets = opts.jsAssets;
    var cssAssets = opts.cssAssets;

    return {
        mobile: function () {
            return gulp.src([assetsDir + '/img/*'])
                .pipe(gulp.dest(distDir + 'img'));
        },
        img: function () {
            return gulp.src([assetsDir + '/img/*'])
                .pipe(gulp.dest(distDir + 'img'));
        },
        html: function () {
            return gulp.src([assetsDir + '/html/*'])
                .pipe(gulp.dest(distDir + 'html'));
        },
        font: function () {
            return gulp.src([assetsDir + '/fonts/*'])
                .pipe(gulp.dest(distDir + 'fonts'));
        },
        js: function () {
            return gulp.src(jsAssets)
                .pipe(rename(function (path) {
                    path.dirname = '';
                }))
                .pipe(gulp.dest(distDir + 'js'));
        },
        css: function () {
            return gulp.src(cssAssets)
                .pipe(rename(function (path) {
                    path.dirname = '';
                }))
                .pipe(gulp.dest(distDir + 'css'));
        },
        '': ['assets.img', 'assets.html', 'assets.font', 'assets.js', 'assets.css']
    };
};