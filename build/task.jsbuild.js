/**
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 *
 */
var _           = require('lodash');
var jsStreams   = require('./streams.jsbuild');

module.exports = function (gulp, opts) {
    var pancakes = opts.pancakes;
    var distDir = opts.distDir || 'dist';
    var distJs = './' + distDir + '/js';
    var commonUI = [];

    /**
     * Clear out the pancakes and node.js cache so watch will work
     */
    function clearCache() {
        pancakes.clearCache();
        for (var key in opts.require.cache) {
            if (opts.require.cache.hasOwnProperty(key) &&
                !key.match(/node_modules/) &&
                !key.match(/\/pancakes\/lib\//)) {

                delete opts.require.cache[key];
            }
        }
    }

    var tasks = {
        libs: function () {
            return jsStreams.generateLibJs(gulp, opts)
                .pipe(gulp.dest(distJs));
        },
        pancakesApp: function () {
            return jsStreams.generatePancakesApp(gulp, opts).pipe(gulp.dest(distJs));
        },
        pluginUtils: function () {
            return jsStreams.generatePluginUtils(gulp, opts).pipe(gulp.dest(distJs));
        },
        utils: function () {
            return jsStreams.generateUtils(gulp, opts).pipe(gulp.dest(distJs));
        },
        api: function () {
            return jsStreams.generateApi(gulp, opts).pipe(gulp.dest(distJs));
        },
        '': ['jsbuild.libs', 'jsbuild.pancakesApp', 'jsbuild.pluginUtils', 'jsbuild.apps', 'jsbuild.utils', 'jsbuild.api']
    };

    function addTask(appName, taskNameExtra, fnName) {
        tasks[appName + taskNameExtra] = function () {
            clearCache();
            return jsStreams[fnName](appName, gulp, opts).pipe(gulp.dest(distJs));
        };
    }

    var apps = [];
    _.each(opts.appConfigs, function (appConfig, appName) {
        var appTaskName = 'jsbuild.' + appName;

        // add app tasks to the list
        apps.push(appTaskName);

        // for the base (i.e. jsbuild.answers)
        tasks[appName] = [appTaskName + 'App', appTaskName + 'UI', appTaskName + 'Utils', appTaskName + 'Other'];

        // now each of the items
        addTask(appName, 'App', 'generateAppCore');
        addTask(appName, 'Utils', 'generateAppUtils');
        addTask(appName, 'Other', 'generateAppOther');

        // common UI added below, but others add here
        if (appName === 'common') {
            addTask(appName, 'UIRaw', 'generateAppUI');
            commonUI.push(appTaskName + 'UIRaw');
        }
        else {
            addTask(appName, 'UI', 'generateAppUI');
            commonUI.push(appTaskName + 'UI');
        }
    });

    // add common UI and apps
    tasks.commonUI = commonUI;
    tasks.apps = apps;

    // return tasks
    return tasks;
};

