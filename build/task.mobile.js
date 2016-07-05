/**
 * Author: Jeff Whelpley
 * Date: 2/23/15
 *
 * Mobile tasks
 */
var _           = require('lodash');
var path        = require('path');
var fs          = require('fs');
var del         = require('del');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var sass        = require('gulp-sass');
var minifyCSS   = require('gulp-clean-css');
var streamqueue = require('streamqueue');
var jsStreams   = require('./streams.jsbuild');
var objMode     = { objectMode: true };

module.exports = function (gulp, opts) {
    opts = opts || {};
    opts.deploy = false;
    opts.config = opts.config || {};

    if ( opts.env && opts.env !== 'dev' ) {
        opts.config = '';
    }

    // console.log('opts: ' + JSON.stringify((opts)));

    // need to do things in this order to avoid changes to opts affecting other tasks
    opts = _.extend({ isMobile: true }, opts);

    var pancakes = opts.pancakes;
    var mobileDir = opts.mobileDir || 'mobile';
    var assetsDir = opts.assetsDir || 'assets';
    var mobileOpts = _.extend({ isMobile: true }, opts);
    var tasks = {
        layout: [],
        js: [],
        //jslib: [],
        css: [],
        img: [],
        fonts: [],
        assets: [],
        resources: [],
        clean: [],
        watch: [],
        maps: [],
        '': ['mobile.assets', 'mobile.resources', 'mobile.img', 'mobile.js', 'mobile.css', 'mobile.fonts', 'mobile.layout', 'mobile.maps']
        //'': ['mobile.assets', 'mobile.resources', 'mobile.img', 'mobile.jslib', 'mobile.js', 'mobile.css', 'mobile.fonts', 'mobile.layout', 'mobile.maps']
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
        //tasks.jslib.push('mobile.jslib' + appName);
        tasks.js.push('mobile.js' + appName);
        tasks.css.push('mobile.css' + appName);
        tasks.img.push('mobile.img' + appName);
        tasks.fonts.push('mobile.fonts' + appName);
        tasks.assets.push('mobile.assets' + appName);
        tasks.resources.push('mobile.resources' + appName);
        tasks.clean.push('mobile.clean' + appName);
        tasks.watch.push('mobile.watch' + appName);
        tasks.maps.push('mobile.maps' + appName);

        // for layout we are converting a ui component to basic HTML
        tasks['layout' + appName] = function () {

            if (appName === 'contact') {
                var sidebarLayout = require(opts.targetDir + '/app/common/layouts/sidebar.layout.js');
                var contactLayout = require(opts.targetDir + '/app/contact/layouts/contact.layout.js');

                // first generate the sidebarLayout
                var sidebarOpts = _.extend({
                    filePath: 'app/common/layouts/sidebar.layout.js',
                    moduleName: 'sidebarLayout',
                    appName: 'contact',
                    isMobile: true,
                    htmlOnly: true,
                    transformer: 'uipart',
                    clientType: 'ng'
                }, opts);
                var sidebarLayoutContent = pancakes.transform(sidebarLayout, sidebarOpts, sidebarOpts);

                // now get the full page
                var contactOpts = _.extend({
                    filePath: 'app/contact/layouts/contact.layout.js',
                    moduleName: 'contactLayout',
                    appName: 'contact',
                    isMobile: true,
                    htmlOnly: true,
                    pageContent: sidebarLayoutContent,
                    transformer: 'uipart',
                    clientType: 'ng'
                }, opts);
                var contactLayoutContent = pancakes.transform(contactLayout, contactOpts, contactOpts);

                // this is a complete hack. Issue with sideview.layout where "doIt('sdf')" gets
                // translated to "doIt(\\'sdf\\')" in the html. no idea why, but we need to get rid
                // of the \\. since this only affects the contact sideview.layout, safe to do this
                // for now, but remove in the future
                contactLayoutContent = contactLayoutContent.replace(/\\\\/g, '');

                fs.writeFileSync(opts.targetDir + '/' + mobileAppDir + '/index.html', contactLayoutContent);

                return true;
            }
            else {
                return gulp.src('app/' + appName + '/layouts/' + appName + '.layout.js')
                    .pipe(pancakes({ transformer: 'uipart', htmlOnly: true }))
                    .pipe(rename('index.html'))
                    .pipe(gulp.dest(mobileAppDir));
            }
        };

        tasks['js' + appName] = function () {
            return streamqueue(objMode,
                jsStreams.generateLibJs(gulp, mobileOpts),
                jsStreams.generatePancakesApp(gulp, opts),
                jsStreams.generateAppJs('common', gulp, opts),
                jsStreams.generatePluginUtils(gulp, opts),
                jsStreams.generateUtils(gulp, opts),
                jsStreams.generateApi(gulp, opts),
                jsStreams.generateAppJs(appName, gulp, mobileOpts)
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
            return gulp.src(['node_modules/ionic-sdk/release/fonts/*'])
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

        tasks['resources' + appName] = function () {
            return gulp.src([
                appDir + 'resources/**/*'
            ])
                .pipe(gulp.dest(mobileAppRoot + '/resources'));
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
                .pipe(rename(function (filePath) {
                    filePath.dirname = '';
                }))
                .pipe(gulp.dest(mobileAppDir + '/js'));
        };
    });

    return tasks;
};
