/**
 * Author: Jeff Whelpley
 * Date: 4/23/15
 *
 * These tasks are essentially wrappers around the OpsWorks API
 * to be able to manage infrastructure on AWS. Refer to the OpsWorks API docs:
 *      http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/OpsWorks.html
 *      http://docs.aws.amazon.com/cli/latest/reference/opsworks/index.html
 */
var _       = require('lodash');
var Q       = require('q');
var AWS     = require('aws-sdk');
var gutil   = require('gulp-util');

module.exports = function (gulp, opts) {
    var config = opts.config || {};
    var name = opts.name;
    var awsConfig = config.aws || {};
    var stackId = awsConfig.stackId;
    var appId = awsConfig.appId;
    var targetWeb = !opts.target || opts.target === 'web';
    var targetApi = !opts.target || opts.target === 'api';
    var targetBoth = targetWeb && targetApi;
    var secureHints = ['KEY', 'SECRET', 'TOKEN', 'URL', 'PWD', 'PASSWORD', 'JWT'];

    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    var opsworks = new AWS.OpsWorks({
        accessKeyId:        awsConfig.keyId,
        secretAccessKey:    awsConfig.secret,
        region:             awsConfig.uploads && awsConfig.uploads.region
    });

    /**
     * Get the instance ids for a particular layer
     */
    function getInstanceIds() {

        // if targeting both web and api, then return null which means ALL instances
        if (targetBoth) {
            return new Q();
        }

        var deferred = Q.defer();
        var params = {
            LayerId: targetWeb ? awsConfig.webLayerId : awsConfig.apiLayerId
        };

        opsworks.describeInstances(params, function (err, data) {
            if (err) {
                deferred.reject(err);
            }
            else if (!data || !data.Instances) {
                deferred.resolve();
            }
            else {
                deferred.resolve(data.Instances.map(function (instance) {
                    return instance.InstanceId;
                }));
            }


            err ? deferred.reject(err) : deferred.resolve(data);
        });

        return deferred.promise;
    }

    /**
     * Run one of the createDeployment commands.
     * @param params
     */
    function runCommand(params) {
        var deferred = Q.defer();

        params = params || {};
        params.StackId = stackId;

        getInstanceIds()
            .then(function (instanceIds) {
                if (instanceIds) {
                    params.InstanceIds = instanceIds;
                }

                opsworks.createDeployment(params, function (err, data) {
                    err ? deferred.reject(err) : deferred.resolve(data);
                });
            })
            .catch(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    }

    /**
     * Determine if an environment key should be secure or not
     * @param envKey
     * @returns {boolean}
     */
    function isSecure(envKey) {
        var i, secureHint;
        for (i = 0; i < secureHints.length; i++) {
            secureHint = secureHints[i];

            if (envKey.indexOf(secureHint) > -1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Conver the command line environment vars (i.e. --vars "blah=foo,choo=moo")
     * into custom JSON.
     */
    function getEnvVarsJson() {
        var envVars = opts.vars || '';
        var keyValues = envVars.split(',') || [];
        var json = {};

        _.each(keyValues, function (keyValue) {
            var keyValArr = keyValue.split(':');
            var key = keyValArr[0];
            json[key] = keyValArr[1];
        });

        if (targetWeb && !targetApi) {
            json.CONTAINER = 'web';
        }
        else if (targetApi && !targetWeb) {
            json.CONTAINER = 'api';
        }

        return JSON.stringify({
            deploy: {
                app: {
                    'environment_variables': json
                }
            }
        });
    }

    // return the gulp tasks
    return {

        /**
         * Update the cookbooks (both web and api).
         * Done after making a change to the cookbooks.
         *      gulp aws.cookbooks --target=[web|api]
         *      aws opsworks create-deployment --command update_custom_cookbooks --stack-id {stackId} --instance-ids {instance ids}
         */
        cookbooks: function () {
            return runCommand({
                Command: { Name: 'update_custom_cookbooks' }
            });
        },

        /**
         * Execute arbitrary recipes. For example:
         *      gulp aws.recipes --name=deploy::nodejs-restart --target=[web|api]
         *      aws opsworks create-deployment --command "{\"Name\":\"execute_recipes\",\"Args\":{\"recipes\":[\"pm2\"]}}" --instance-ids {instance ids}
         */
        recipes: function () {
            if (!name) {
                return Q.reject('No name specified');
            }

            var recipes = name.split(',');
            var params = {
                Command: {
                    Name: 'execute_recipes',
                    Args: { recipes: recipes }
                }
            };

            if (opts.json) {
                params.CustomJson = opts.json;
            }

            return runCommand(params);
        },

        /**
         * Update the application environment variables. Due to contraints in AWS, we have to
         * overwrite all environment variables each time. We cannot (through the AWS API)
         * update one individual value. To do that, you need to go through the AWS console.
         *
         *      gulp aws.env --env=staging
         *      aws opsworks update-app --app-id 5098939a-059e-478e-88a7-6f5966606e1b --environment "[{\"Key\":\"boo\",\"Value\":\"yeah\"}]"
         */
        env: function () {
            var deferred = Q.defer();
            var env = [];

            // create an array of environment variables
            _.each(config.envVars, function (val, key) {
                var secure = isSecure(key);
                if (key !== 'GOOGLE_KEY' && key !== 'type' && val) {
                    gutil.log(key + '=' + val);
                    env.push({ Key: key, Value: val, Secure: secure });
                }
            });

            // set up the params for updateApp
            var params = { AppId: appId, Environment: env };

            opsworks.updateApp(params, function (err, data) {
                err ? deferred.reject(err) : deferred.resolve(data);
            });

            return deferred.promise;
        },

        /**
         * Deploy the latest
         *      gulp aws.deploy --vars=CLIENT_VERSION:123 --target=web
         *      aws opsworks create-deployment --command deploy --instance-ids {instance ids} --custom-json {json here}
         */
        deploy: function () {
            return runCommand({
                Command:    { Name: 'deploy' },
                AppId:      appId,
                CustomJson: getEnvVarsJson()
            });
        },

        /**
         * Rollback to a previous version
         */
        rollback: function () {
            return runCommand({
                Command:    { Name: 'rollback' },
                AppId:      appId
            });
        },

        /**
         * Restart the node app through pm2. Also, optionally pass in changes
         * to environment variables
         */
        restart: function () {
            return runCommand({
                Command: {
                    Name: 'execute_recipes',
                    Args: { recipes: ['deploy::nodejs-restart']  }
                },
                CustomJson: getEnvVarsJson()
            });
        }
    };
};