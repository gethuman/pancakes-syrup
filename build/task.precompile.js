/**
 * Author: Jeff Whelpley
 * Date: 2/15/15
 *
 * Task used to precompile HTML; simply uses the gulp plugin for pancakes
 */
module.exports = function (gulp, opts) {
    var pancakes = opts.pancakes;
    var tpls = [].concat(opts.tpls || 'app/**/*.html');
    var tplOutputDir = opts.tplOutputDir || 'dist/tpls';

    if (!pancakes) {
        throw new Error('batter.whip() must include pancakes in opts');
    }

    return function () {
        return gulp.src(tpls)
            .pipe(pancakes({ tpls: tpls }))
            .pipe(gulp.dest(tplOutputDir));
    };
};