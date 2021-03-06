 /**
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 *
 */
var cssbuild    = require('./streams.cssbuild');
var jsbuild     = require('./streams.jsbuild');
var s3          = require('./streams.s3');
var awspublish  = require('gulp-awspublish');
var aws         = require('./streams.aws');
var Q           = require('q');
var _           = require('lodash');
var eventStream = require('event-stream');
var streamqueue = require('streamqueue');
var rename      = require('gulp-rename');
var concat      = require('gulp-concat');
var replace     = require('gulp-replace');
var uglify      = require('gulp-uglify');
var minifyCSS   = require('gulp-clean-css');
var gutil       = require('gulp-util');
var path        = require('path');
var delim       = path.normalize('/');
var objMode     = { objectMode: true };

module.exports = function (gulp, opts) {
    opts = opts || {};
    opts.deploy = true;

    var timestamp       = opts.timestamp || (new Date()).getTime() + '';
    var outputPrefix    = opts.outputPrefix;
    var config          = opts.config || {};
    var env             = opts.env;
    var assetsDir       = opts.assetsDir || (opts.rootDir + delim + 'assets');
    var jsAssets        = opts.jsAssets;
    var cssAssets       = opts.cssAssets || [];
    var awsConfig       = config.aws || {};
    var s3opts = {
        accessKeyId:        awsConfig.keyId,
        secretAccessKey:    awsConfig.secret,
        params: {
            Bucket:         awsConfig.assets && awsConfig.assets.bucket
        }
    };

    return {

        fonts: function () {
            var stream = gulp.src([assetsDir + delim + 'fonts/*'])
                .pipe(rename(function (filePath) {
                    filePath.basename += '.' + opts.timestamp;
                }));

            return s3.uploadFromStream(stream, 'fonts', s3opts);
        },

        // copy all the local assets to the target s3 bucket
        assets: function () {
            if (!env) {
                throw new Error('env param must be set for deploy    tasks');
            }

            // create publisher for css assets
            var publisher = awspublish.create(s3opts);

            gutil.log('deploying assets to CDN');
            return eventStream.merge(
                s3.uploadFiles(gulp, [assetsDir + delim + 'html/*'], 'html', s3opts),
                s3.uploadFiles(gulp, [assetsDir + delim + 'img/*'], 'img', s3opts),
                s3.uploadFiles(gulp, jsAssets, 'js', s3opts),

                // one off case for css assets which is the async font file
                gulp.src(cssAssets)
                    .pipe(replace(/gh\.eot/g, 'gh.' + timestamp + '.eot'))
                    .pipe(replace(/gh\.woff/g, 'gh.' + timestamp + '.woff'))
                    .pipe(replace(/gh\.ttf/g, 'gh.' + timestamp + '.ttf'))
                    .pipe(replace(/gh\.svg/g, 'gh.' + timestamp + '.svg'))
                    .pipe(rename(function (filePath) {
                        filePath.dirname = 'css';
                    }))
                    .pipe(awspublish.gzip({}))
                    .pipe(publisher.publish({
                        'Cache-Control': 'max-age=315360000, no-transform, public'
                    }))
                    .pipe(awspublish.reporter({}))
            );
        },

        // deploy latest JavaScript and CSS
        jscss: function () {
            if (!env) {
                throw new Error('env param must be set for deploy    tasks');
            }

            var cssName = outputPrefix + '.all.' + timestamp + '.css';
            var jsCommonName = outputPrefix + '.common.' + timestamp + '.js';
            var jsLazyName = outputPrefix + '.lazy.' + timestamp + '.js';
            var newFiles = [cssName, jsCommonName];

            var cssStream = cssbuild.generateCss(gulp, opts)
                .pipe(replace(/gh\.eot/g, 'gh.' + timestamp + '.eot'))
                .pipe(replace(/gh\.woff/g, 'gh.' + timestamp + '.woff'))
                .pipe(replace(/gh\.ttf/g, 'gh.' + timestamp + '.ttf'))
                .pipe(replace(/gh\.svg/g, 'gh.' + timestamp + '.svg'))
                .pipe(rename(cssName))
                .pipe(minifyCSS({ rebase: false }));

            var jsStream = streamqueue(objMode,
                jsbuild.generateLibJs(gulp, opts),
                jsbuild.generateCommonJs(gulp, opts).pipe(uglify())
            ).pipe(concat(jsCommonName));

            var lazyStream = jsbuild.generateLazyJs(gulp, opts)
                .pipe(rename(jsLazyName));

            // array will contains streams for each custom JS and CSS file going to s3
            var buildArr = [
                s3.uploadFromStream(cssStream, 'css', s3opts),
                s3.uploadFromStream(jsStream, 'js', s3opts),
                s3.uploadFromStream(lazyStream, 'js', s3opts)
            ];

            _.each(opts.appConfigs, function (appConfig, appName) {
                if (appName !== 'common') {
                    var appFileName = outputPrefix + '.' + appName + '.combo.' + timestamp + '.js';
                    newFiles.push(appFileName);
                    var appStream = jsbuild.generateComboJs(appName, gulp, opts)
                        .pipe(rename(appFileName))
                        .pipe(uglify());

                    buildArr.push(s3.uploadFromStream(appStream, 'js', s3opts));
                }
            });

            // makes sure all JavaScript and CSS deployed
            var deferred = Q.defer();

            eventStream.merge.apply(null, buildArr)
                .on('end', function () {

                    // once jsbuild done, update the CLIENT_VERSION
                    var clientVersion = { 'CLIENT_VERSION': timestamp };
                    aws.updateEnvironmentVariables(clientVersion, config.envVars, awsConfig)
                        .then(function () {
                            gutil.log('Updated CLIENT_VERSION to ' + timestamp);
                            deferred.resolve();
                        })
                        .catch(function (err) {
                            deferred.reject(err);
                        });
                })
                .on('error', function (err) {
                    deferred.reject(err);
                });

            return deferred.promise;
        },

        // deploy new app; if want to set version, need to pass it in via --version=1234
        app: function () {
            if (!env) {
                throw new Error('env param must be set for deploy    tasks');
            }

            var envOverrides = opts.version ? { 'CLIENT_VERSION': opts.version } : {};
            return aws.deploy(envOverrides, opts.target, config.aws);
        },

        // deploy everything (i.e. assets, jscss, code)
        '': {
            deps: ['deploy.fonts', 'deploy.assets', 'deploy.jscss'],
            task: function () {
                if (!env) {
                    throw new Error('env param must be set for deploy tasks');
                }

                return aws.deploy({ 'CLIENT_VERSION': timestamp }, opts.target, config.aws);
            }
        }
    };
};
