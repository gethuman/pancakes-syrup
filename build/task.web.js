/**
 * Author: Jeff Whelpley
 * Date: 5/1/15
 *
 * Livereload for website
 */
module.exports = function (gulp, opts) {
    return function () {
        var _           = require('lodash');
        var nodemon     = require('nodemon');
        var livereload  = require('gulp-livereload');
        var startScript = opts.targetDir + '/start.js';
        var shouldLiveReload = opts.livereload && opts.livereload === 'true';
        var clientPlugin = (opts.pancakesConfig && opts.pancakesConfig.clientPlugin) || {};
        var clientPluginLib = (opts.deploy ? clientPlugin.clientLibMinPath : clientPlugin.clientLibPath) || '';

        livereload.listen();

        nodemon({
            script: startScript,
            watch:  ['middleware', 'dist', 'utils/translations.json']
        })
            .on('restart', function () {
                if (shouldLiveReload) {
                    setTimeout(function () {
                        livereload.reload();
                    }, 2000);
                }
            });

        gulp.watch(['app/common/**/*.less'], ['cssbuild']);
        gulp.watch([clientPluginLib], ['jsbuild.pluginUtils']);
        gulp.watch(['utils/*.js'], ['jsbuild.utils']);
        gulp.watch(['services/resources/**/*.resource.js'], ['jsbuild.api']);

        _.each(opts.pancakesConfig.modulePlugins, function (plugin) {
            gulp.watch([plugin.rootDir + '/utils/*.js'], ['jsbuild.utils']);
        });

        _.each(opts.appConfigs, function (appConfig, appName) {
            gulp.watch(['app/' + appName + '/**/*.less'], ['cssbuild']);

            gulp.watch([
                'app/' + appName + '/' + appName + '.app.js',
                'app/' + appName + '/ng.config/*.js',
                'app/' + appName + '/' + appName + '.app.js'
            ], ['jsbuild.' + appName + 'App']);
            gulp.watch([
                'app/' + appName + '/partials/*.partial.js',
                'app/' + appName + '/pages/*.page.js'
            ], ['jsbuild.' + appName + 'UI', 'jsbuild.' + appName + 'App']);
            gulp.watch(['app/' + appName + '/utils/*.js'], ['jsbuild.' + appName + 'Utils']);
            gulp.watch([
                'app/' + appName + '/filters/*.js',
                'app/' + appName + '/ng.directives/*.js',
                'app/' + appName + '/jng.directives/*.js'
            ], ['jsbuild.' + appName + 'Other']);
        });
    };
};