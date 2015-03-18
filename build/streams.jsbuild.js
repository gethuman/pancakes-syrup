/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * Streams for handling JavaScript
 */
var concat      = require('gulp-concat');
var eventStream = require('event-stream');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };

/**
 * Generate one combined Javascript file for a given app
 * @param gulp
 * @param opts
 */
function generateLibJs(gulp, opts) {
    var libs = opts.isMobile ?
        [].concat(opts.jsMobileLibs) :
        [].concat(opts.jsLibs);

    return gulp.src(libs)
        .pipe(concat(opts.outputPrefix + '.libs.js'));
}

/**
 * Generate one combined Javascript file for a given app
 * @param appName
 * @param gulp
 * @param opts
 */
function generateAppJs(appName, gulp, opts) {
    var pancakes = opts.pancakes;

    if (!pancakes) {
        throw new Error('batter.whip() must include pancakes in opts');
    }

    // this is a one off case where we need to ensure page helper has a client side implementation
    //TODO: see if we can make this cleaner in the future
    var pageHelper = pancakes.cook('pageHelper');

    return streamqueue(objMode,
        gulp.src(['app/' + appName + '/' + appName + '.app.js'])
            .pipe(pancakes({ transformer: 'app', pageHelper: pageHelper })),
        gulp.src(['app/' + appName + '/ng.config/*.js'])
            .pipe(pancakes({ ngType: 'config', transformer: 'basic', isClient: true })),
        gulp.src(['app/' + appName + '/' + appName + '.app.js'])
            .pipe(pancakes({ transformer: 'routing', config: opts.config })),
        eventStream.merge(
            gulp.src([ 'app/' + appName + '/partials/*.partial.js', 'app/' + appName + '/pages/*.page.js' ])
                .pipe(pancakes({ transformer: 'uipart' })),
            gulp.src(['app/' + appName + '/utils/*.js'])
                .pipe(pancakes({ ngType: 'factory', transformer: 'basic' })),
            gulp.src(['app/' + appName + '/filters/*.js'])
                .pipe(pancakes({ ngType: 'filter', transformer: 'basic', isClient: true })),
            gulp.src(['app/' + appName + '/ng.directives/*.js'])
                .pipe(pancakes({ ngType: 'directive', transformer: 'basic', isClient: true })),
            gulp.src(['app/' + appName + '/jng.directives/*.js'])
                .pipe(pancakes({ ngType: 'directive', transformer: 'basic', isClient: true }))
        )
    )
        .pipe(concat(opts.outputPrefix + '.' + appName + '.js'));
}

/**
 * Generate one combined Javascript file for a given app
 * @param gulp
 * @param opts
 */
function generateCommonJs(gulp, opts) {
    var pancakes = opts.pancakes;
    var clientPluginLib = opts.pancakesConfig && opts.pancakesConfig.clientPlugin &&
        opts.pancakesConfig.clientPlugin.clientLibPath;

    if (!pancakes) {
        throw new Error('batter.whip() must include pancakes in opts');
    }

    if (!clientPluginLib) {
        throw new Error('No clientPlugin set in the pancakes config');
    }

    return streamqueue(objMode,
        gulp.src(clientPluginLib),
        generateAppJs('common', gulp, opts),
        gulp.src(pancakes.getPluginModules('utils'))
            .pipe(pancakes({ ngType: 'factory', transformer: 'basic', isFromPlugin: true })),
        eventStream.merge(
            gulp.src(['utils/*.js'])
                .pipe(pancakes({ ngType: 'factory', transformer: 'basic' })),
            gulp.src(['services/resources/**/*.resource.js'])
                .pipe(pancakes({ transformer: 'apiclient' }))
        )
    )
        .pipe(concat(opts.outputPrefix + '.common.js'));
}

module.exports = {
    generateLibJs:      generateLibJs,
    generateAppJs:      generateAppJs,
    generateCommonJs:   generateCommonJs
};