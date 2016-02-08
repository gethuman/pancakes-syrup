/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * Streams for handling JavaScript
 */
var concat      = require('gulp-concat');
var file        = require('gulp-file');
var eventStream = require('event-stream');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };

function generateLibJs(gulp, opts) {
    var libs = opts.isMobile ?
        [].concat(opts.jsMobileLibs) :
        [].concat(opts.jsLibs);

    return gulp.src(libs)
        .pipe(concat(opts.outputPrefix + '.libs.js'));
}

function generateAppCore(appName, gulp, opts) {
    var pancakes = opts.pancakes;

    return streamqueue(objMode,
        gulp.src(['app/' + appName + '/' + appName + '.app.js'])
            .pipe(pancakes({ transformer: 'app', isMobile: opts.isMobile })),
        gulp.src(['app/' + appName + '/ng.config/*.js'])
            .pipe(pancakes({ ngType: 'config', transformer: 'basic', isClient: true })),
        gulp.src(['app/' + appName + '/' + appName + '.app.js'])
            .pipe(pancakes({ transformer: 'routing', config: opts.config }))
    )
        .pipe(concat(opts.outputPrefix + '.' + appName + '.app.js'));
}

function generateAppUI(appName, gulp, opts) {
    var pancakes = opts.pancakes;
    return eventStream.merge(
        gulp.src([
            'app/' + appName + '/partials/*.partial.js',
            'app/' + appName + '/pages/*.page.js'
        ]),
        file('blank.js', ' ', { src: true })
    )
        .pipe(pancakes({ transformer: 'uipart' }))
        .pipe(concat(opts.outputPrefix + '.' + appName + '.ui.js'));
}

function generateAppUtils(appName, gulp, opts) {
    var pancakes = opts.pancakes;
    return eventStream.merge(
        gulp.src(['app/' + appName + '/utils/*.js']),
        file('blank.js', ' ', { src: true })
    )
        .pipe(pancakes({ ngType: 'factory', transformer: 'basic' }))
        .pipe(concat(opts.outputPrefix + '.' + appName + '.utils.js'));
}

function generateAppOther(appName, gulp, opts) {
    var pancakes = opts.pancakes;
    return eventStream.merge(
        gulp.src(['app/' + appName + '/filters/*.js'])
            .pipe(pancakes({ ngType: 'filter', transformer: 'basic', isClient: true })),
        gulp.src(['app/' + appName + '/ng.directives/*.js'])
            .pipe(pancakes({ ngType: 'directive', transformer: 'basic', isClient: true })),
        gulp.src(['app/' + appName + '/jng.directives/*.js'])
            .pipe(pancakes({ ngType: 'directive', transformer: 'basic', isClient: true })),
        file('blank.js', ' ', { src: true })
    )
        .pipe(concat(opts.outputPrefix + '.' + appName + '.other.js'));
}

function generateAppJs(appName, gulp, opts) {
    var pancakes = opts.pancakes;

    if (!pancakes) {
        throw new Error('batter.whip() must include pancakes in opts');
    }

    return streamqueue(objMode,
        generateAppCore(appName, gulp, opts),
        eventStream.merge(
            generateAppUI(appName, gulp, opts),
            generateAppUtils(appName, gulp, opts),
            generateAppOther(appName, gulp, opts)
        )
    )
        .pipe(concat(opts.outputPrefix + '.' + appName + '.js'));
}

function generatePancakesApp(gulp, opts) {
    var clientPlugin = (opts.pancakesConfig && opts.pancakesConfig.clientPlugin) || {};
    var clientPluginLib = (opts.deploy ? clientPlugin.clientLibMinPath : clientPlugin.clientLibPath) || '';
    return gulp.src(clientPluginLib)
        .pipe(concat(opts.outputPrefix + '.pancakes.app.js'));
}

function generatePluginUtils(gulp, opts) {
    var pancakes = opts.pancakes;
    return gulp.src(pancakes.getPluginModules('utils'))
        .pipe(pancakes({ ngType: 'factory', transformer: 'basic', isFromPlugin: true }))
        .pipe(concat(opts.outputPrefix + '.plugin.utils.js'));
}

function generateUtils(gulp, opts) {
    var pancakes = opts.pancakes;
    return gulp.src(['utils/*.js'])
        .pipe(pancakes({ ngType: 'factory', transformer: 'basic' }))
        .pipe(concat(opts.outputPrefix + '.utils.js'));
}

function generateApi(gulp, opts) {
    var pancakes = opts.pancakes;
    return gulp.src(['services/resources/**/*.resource.js'])
        .pipe(pancakes({ transformer: 'apiclient' }))
        .pipe(concat(opts.outputPrefix + '.api.js'));
}

/**
 * Generate one combined Javascript file for a given app
 * @param gulp
 * @param opts
 */
function generateCommonJs(gulp, opts) {
    var pancakes = opts.pancakes;

    if (!pancakes) {
        throw new Error('batter.whip() must include pancakes in opts');
    }

    return streamqueue(objMode,
        generatePancakesApp(gulp, opts),
        generateAppJs('common', gulp, opts),
        generatePluginUtils(gulp, opts),
        eventStream.merge(
            generateUtils(gulp, opts),
            generateApi(gulp, opts)
        )
    )
        .pipe(concat(opts.outputPrefix + '.common.js'));
}

module.exports = {
    generateLibJs:          generateLibJs,

    generateAppCore:        generateAppCore,
    generateAppUI:          generateAppUI,
    generateAppUtils:       generateAppUtils,
    generateAppOther:       generateAppOther,
    generateAppJs:          generateAppJs,

    generatePancakesApp:    generatePancakesApp,
    generatePluginUtils:    generatePluginUtils,

    generateUtils:          generateUtils,
    generateApi:            generateApi,

    generateCommonJs:       generateCommonJs
};