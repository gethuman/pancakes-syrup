/**
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 *
 */
var cssbuild    = require('./streams.cssbuild');
var jsbuild     = require('./streams.jsbuild');
var s3          = require('./streams.s3');
var _           = require('lodash');
var eventStream = require('event-stream');
var streamqueue = require('streamqueue');
var rename      = require('gulp-rename');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var minifyCSS   = require('gulp-minify-css');
var path        = require('path');
var delim       = path.normalize('/');
var objMode     = { objectMode: true };

module.exports = function (gulp, opts) {
    var outputPrefix = opts.outputPrefix;
    var config = opts.config;
    var assetsDir = opts.assetsDir || (opts.rootDir + delim + 'assets');
    var jsAssets = opts.jsAssets;
    var s3opts = {
        key:    config.aws.keyId,
        secret: config.aws.secret,
        bucket: config.aws.assets.bucket
    };

    return {
        jscss: function (done) {
            var timestamp = (new Date()).getTime();
            var cssStream = cssbuild.generateCss(gulp, opts)
                .pipe(rename(outputPrefix + '.all.' + timestamp + '.js'))
                .pipe(minifyCSS());
            var jsStream = streamqueue(objMode,
                jsbuild.generateLibJs(gulp, opts),
                jsbuild.generateCommonJs(gulp, opts)
                    .pipe(uglify())
            ).pipe(concat(outputPrefix + '.common.' + timestamp + '.js'));

            // array will contains streams for each custom JS and CSS file going to s3
            var buildArr = [
                s3.uploadFromStream(cssStream, 'css', s3opts),
                s3.uploadFromStream(jsStream, 'js', s3opts)
            ];

            _.each(opts.appConfigs, function (appConfig, appName) {
                if (appName !== 'common') {
                    var appStream = jsbuild.generateAppJs(appName, gulp, opts)
                        .pipe(rename(outputPrefix + '.' + appName + '.' + timestamp + '.js'))
                        .pipe(uglify());

                    buildArr.push(s3.uploadFromStream(appStream, 'js', s3opts));
                }
            });

            return eventStream.merge.apply(null, buildArr)
                .on('finish', function () {

                    //TODO: change environment variable here and call done()
                    done();

                });
        },

        // copy all the local assets to the target s3 bucket
        assets: function () {
            return eventStream.merge(
                s3.uploadFiles(gulp, [assetsDir + delim + 'fonts/*'], 'fonts', s3opts),
                s3.uploadFiles(gulp, [assetsDir + delim + 'html/*'], 'html', s3opts),
                s3.uploadFiles(gulp, [assetsDir + delim + 'img/*'], 'img', s3opts),
                s3.uploadFiles(gulp, jsAssets, 'js', s3opts)
            );
        },

        app: function () {

            // deploy to ec2 via opsworks

        },

        // gulp deploy will run all the tasks here
        '': ['deploy.assets', 'deploy.app', 'deploy.jscss']
    };
};
