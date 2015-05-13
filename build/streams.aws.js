/**
 * Author: Jeff Whelpley
 * Date: 5/12/15
 *
 * Common AWS functions that we want to share among tasks
 */
var _   = require('lodash');
var Q   = require('q');
var AWS = require('aws-sdk');

// help determine if environment variable is secure
var secureHints = ['KEY', 'SECRET', 'TOKEN', 'URL', 'PWD', 'PASSWORD', 'JWT'];

/**
 * Get a reference to the opsworks object
 * @param awsConfig
 */
function getOpsworks(awsConfig) {
    return new AWS.OpsWorks({
        accessKeyId:        awsConfig.keyId,
        secretAccessKey:    awsConfig.secret,
        region:             awsConfig.uploads && awsConfig.uploads.region
    });
}

/**
 * Get the instance ids for a particular layer
 * @param target [web|api]
 * @param awsConfig
 */
function getInstanceIds(target, awsConfig) {
    var targetWeb = !target || target === 'web';
    var targetApi = !target || target === 'api';

    // if targeting both web and api, then return null which means ALL instances
    if (targetWeb && targetApi) {
        return new Q();
    }

    var deferred = Q.defer();
    var params = {
        LayerId: targetWeb ? awsConfig.webLayerId : awsConfig.apiLayerId
    };

    var opsworks = getOpsworks(awsConfig);
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
 * @param commandParams
 * @param target
 * @param awsConfig
 */
function runCommand(commandParams, target, awsConfig) {
    var deferred = Q.defer();

    commandParams = commandParams || {};
    commandParams.StackId = awsConfig.stackId;

    getInstanceIds(target, awsConfig)
        .then(function (instanceIds) {
            if (instanceIds) {
                commandParams.InstanceIds = instanceIds;
            }

            var opsworks = getOpsworks(awsConfig);
            opsworks.createDeployment(commandParams, function (err, data) {
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
 * Conver the command line environment vars (i.e. --vars="blah=foo,choo=moo")
 * into custom JSON.
 *
 * @param envVars Name/value pairs from the command line (ex. blah=boo)
 */
function getEnvVarsJson(envVars) {
    envVars = envVars || '';
    var json = {};

    // if string need to convert to an object
    if (_.isString(envVars)) {
        var keyValues = envVars.split(',') || [];

        _.each(keyValues, function (keyValue) {
            var keyValArr = keyValue.split(':');
            var key = keyValArr[0];
            json[key] = keyValArr[1];
        });
    }
    else {
        json = envVars;
    }

    return JSON.stringify({
        deploy: {
            app: {
                'environment_variables': json
            }
        }
    });
}

/**
 * Update the cookbooks
 * @param target
 * @param awsConfig
 * @returns {*}
 */
function updateCookbooks(target, awsConfig) {
    var params = {
        Command: { Name: 'update_custom_cookbooks' }
    };
    return runCommand(params, target, awsConfig);
}

/**
 * Execute a given set of recipes
 * @param recipeNames
 * @param json
 * @param target
 * @param awsConfig
 * @returns {*}
 */
function execRecipes(recipeNames, json, target, awsConfig) {
    if (!recipeNames) {
        return Q.reject('No recipe names specified');
    }

    var recipes = recipeNames.split(',');
    var params = {
        Command: {
            Name: 'execute_recipes',
            Args: { recipes: recipes }
        }
    };

    if (json) {
        params.CustomJson = json;
    }

    return runCommand(params, target, awsConfig);
}

/**
 * Update environment variables for a given app
 *
 * @param newVars From command line
 * @param envVars From config
 * @param awsConfig
 */
function updateEnvironmentVariables(newVars, envVars, awsConfig) {
    var deferred = Q.defer();
    var env = [];

    // create an array of environment variables
    _.each(envVars, function (val, key) {
        var secure = isSecure(key);
        if (key !== 'GOOGLE_KEY' && key !== 'type' && val) {
            env.push({ Key: key, Value: val + '', Secure: secure });
        }
    });

    _.each(newVars, function (val, key) {
        env.push({ Key: key, Value: val + '' });
    });

    // set up the params for updateApp
    var params = { AppId: awsConfig.appId, Environment: env };
    var opsworks = getOpsworks(awsConfig);
    opsworks.updateApp(params, function (err, data) {
        err ? deferred.reject(err) : deferred.resolve(data);
    });

    return deferred.promise;
}

/**
 * Deploy app
 * @param vars
 * @param target
 * @param awsConfig
 * @returns {*}
 */
function deploy(vars, target, awsConfig) {
    var params = {
        Command:    { Name: 'deploy' },
        AppId:      awsConfig.appId,
        CustomJson: getEnvVarsJson(vars)
    };

    return runCommand(params, target, awsConfig);
}

/**
 * Rollback the last deployment
 * @param target
 * @param awsConfig
 * @returns {*}
 */
function rollbackDeployment(target, awsConfig) {
    var params = {
        Command:    { Name: 'rollback' },
        AppId:      awsConfig.appId
    };

    return runCommand(params, target, awsConfig);
}

/**
 * Restart an app (changing environment variables if passed in)
 * Note that we use the pm2 recipe instead of deploy::nodejs-restart
 * because the pm2 recipe will also update all the environment
 * variables which is needed when we modify them during deployment.
 *
 * @param vars
 * @param target
 * @param awsConfig
 * @returns {*}
 */
function restartApp(vars, target, awsConfig) {
    var params = {
        Command: {
            Name: 'execute_recipes',
            Args: { recipes: ['pm2']  }
        },
        CustomJson: getEnvVarsJson(vars)
    };

    return runCommand(params, target, awsConfig);
}

// expose functions for testing
module.exports = {
    getOpsworks: getOpsworks,
    getInstanceIds: getInstanceIds,
    runCommand: runCommand,
    isSecure: isSecure,
    getEnvVarsJson: getEnvVarsJson,
    updateCookbooks: updateCookbooks,
    execRecipes: execRecipes,
    updateEnvironmentVariables: updateEnvironmentVariables,
    deploy: deploy,
    rollbackDeployment: rollbackDeployment,
    restartApp: restartApp
};