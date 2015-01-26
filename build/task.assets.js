/**
 * Copyright 2014 GetHuman LLC
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 * Task for moving all static files from assets to dist
 */
module.exports = function (gulp, opts) {
    var distDir = './' + (opts.distDir || 'dist') + '/';
    var assetsDir = opts.assetsDir || 'assets';
    var jsAssets = opts.jsAssets;

    return {
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
                .pipe(gulp.dest(distDir + '/js'));
        },
        '': ['assets.img', 'assets.html', 'assets.font', 'assets.js']
    };
};