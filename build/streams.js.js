/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * Streams for handling JavaScript
 */
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var eventStream = require('eventStream');
var streamqueue = require('streamqueue');
var objMode     = { objectMode: true };



//TODO: somehow make this generic so any pancakes app can use it


// now functions for each of the JS files
function generateLibJs(gulp) {
    return eventStream.merge(
        gulp.src(['node_modules/spin.js/spin.js']).pipe(uglify()),
        gulp.src([
            'node_modules/deep-diff/releases/deep-diff-0.2.0.min.js',
            'node_modules/moment/min/moment.min.js',
            'node_modules/angular-animate/angular-animate.min.js',
            'node_modules/angular-sanitize/angular-sanitize.min.js',
            'node_modules/angular-touch/angular-touch.min.js',
            'node_modules/angular-ui-router/release/angular-ui-router.min.js',
            'node_modules/angular-loggly/logglyService.min.js',
            'node_modules/angular-file-upload/dist/angular-file-upload.min.js',
            //'node_modules/angular-hotkeys/build/hotkeys.min.js',
            //'node_modules/angular-bindonce/bindonce.min.js',
            //'node_modules/firebase/lib/firebase-node.js',
            'assets/jslibs/firebase.min.js',
            'node_modules/angularfire/dist/angularfire.min.js',
            'assets/jslibs/ui-bootstrap-custom-tpls-0.10.0.min.js',
            'assets/jslibs/magicsuggest-min.js',
            'assets/jslibs/jquery.autosize.1.18.9.min.js',              // custom to make height right

            //TODO: this is 90K, but only needed for some apps
            'assets/jslibs/redactor.min.js'
            //'assets/jslibs/redactor.js'
        ])
    ).pipe(concat('gh.libs.js'));
}


function generateCommonJs(isForProd) {
    return streamqueue(objMode,

        //TODO: better solution for this
        //gulp.src('../pancakes-angular/dist/pancakes.angular.js'),
        //gulp.src('node_modules/pancakes-angular/dist/pancakes.angular.js'),
        gulp.src('node_modules/pancakes-angular/dist/pancakes.angular.min.js'),
        //gulp.src('../modules/pancakes-angular/dist/pancakes.angular.js'),
        generateAppJs('common'),
        gulp.src(pancakes.getPluginModules('utils'))
            .pipe(pancakes({ ngType: 'factory', transformer: 'basic', prod: isForProd, isFromPlugin: true })),
        eventStream.merge(
            gulp.src(['utils/*.js'])
                .pipe(pancakes({ ngType: 'factory', transformer: 'basic', prod: isForProd })),
            gulp.src(['services/resources/**/*.resource.js'])
                .pipe(pancakes({ transformer: 'apiclient', prod: isForProd }))
        )
    )
        .pipe(concat('gh.common.js'));
}

function generateAppJs(appName, isForProd) {
    return streamqueue(objMode,
        gulp.src(['app/' + appName + '/' + appName + '.app.js'])
            .pipe(pancakes({ transformer: 'app', prod: isForProd })),
        gulp.src(['app/' + appName + '/ng.config/*.js'])
            .pipe(pancakes({ ngType: 'config', transformer: 'basic', isClient: true, prod: isForProd })),
        gulp.src(['app/' + appName + '/' + appName + '.app.js'])
            .pipe(pancakes({ transformer: 'routing', prod: isForProd })),
        eventStream.merge(
            gulp.src([ 'app/' + appName + '/partials/*.partial.js', 'app/' + appName + '/pages/*.page.js' ])
                .pipe(pancakes({ transformer: 'uipart', prod: isForProd })),
            gulp.src(['app/' + appName + '/utils/*.js'])
                .pipe(pancakes({ ngType: 'factory', transformer: 'basic', prod: isForProd })),
            gulp.src(['app/' + appName + '/filters/*.js'])
                .pipe(pancakes({ ngType: 'filter', transformer: 'basic', isClient: true, prod: isForProd })),
            gulp.src(['app/' + appName + '/ng.directives/*.js'])
                .pipe(pancakes({ ngType: 'directive', transformer: 'basic', isClient: true, prod: isForProd })),
            gulp.src(['app/' + appName + '/jng.directives/*.js'])
                .pipe(pancakes({ ngType: 'directive', transformer: 'basic', isClient: true, prod: isForProd }))
        )
    )
        .pipe(concat('gh.' + appName + '.js'));
}

module.exports = {
    generateLibJs:      generateLibJs,
    generateCommonJs:   generateCommonJs,
    generateAppJs:      generateAppJs
};