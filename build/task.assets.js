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
    var jsmaps = opts.jsmaps || [
        'node_modules/angular*/*.map'
    ];
    var jslibs = opts.jslibs || [
        'node_modules/angular/angular.min.js',
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/jquery/dist/jquery.min.map'
    ];

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
        jsmaps: function () {
            return gulp.src(jsmaps)
                .pipe(rename(function (path) { path.dirname = ''; }))
                .pipe(gulp.dest('./' + distDir + '/js'));
        },
        jslibs: function () {
            return gulp.src(jslibs)
                .pipe(gulp.dest(distDir + '/js/libs'));
        },
        '': ['assets.img', 'assets.html', 'assets.font', 'assets.jsmaps', 'assets.jslibs']
    };
};