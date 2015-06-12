/**
 * Author: Jeff Whelpley
 * Date: 4/23/15
 *
 * These tasks are essentially wrappers around the OpsWorks API
 * to be able to manage infrastructure on AWS. Refer to the OpsWorks API docs:
 *      http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/OpsWorks.html
 *      http://docs.aws.amazon.com/cli/latest/reference/opsworks/index.html
 */
var _   = require('lodash');
var aws = require('./streams.aws');

module.exports = function (gulp, opts) {
    var target      = opts.target;
    var config      = opts.config || {};
    var env         = opts.env;
    var awsConfig   = config.aws || {};

    // return the gulp tasks
    return {

        /**
         * Update the cookbooks (both web and api).
         * Done after making a change to the cookbooks.
         *      gulp aws.cookbooks --target=[web|api]
         *      aws opsworks create-deployment --command update_custom_cookbooks --stack-id {stackId} --instance-ids {instance ids}
         */
        cookbooks: function () {
            if (!env) {
                throw new Error('env param must be set for aws tasks');
            }

            return aws.updateCookbooks(target, awsConfig);
        },

        /**
         * Execute arbitrary recipes. For example:
         *      gulp aws.exec --recipes=deploy::nodejs-restart --target=[web|api]
         *      aws opsworks create-deployment --command "{\"Name\":\"execute_recipes\",\"Args\":{\"recipes\":[\"pm2\"]}}" --instance-ids {instance ids}
         */
        exec: function () {
            var recipeNames = opts.recipes;
            if (!recipeNames) {
                throw new Error('Need to pass in recipes command line param');
            }
            if (!env) {
                throw new Error('env param must be set for aws tasks');
            }

            return aws.execRecipes(recipeNames, opts.json, target, awsConfig);
        },

        /**
         * Update the application environment variables. Due to contraints in AWS, we have to
         * overwrite all environment variables each time. We cannot (through the AWS API)
         * update one individual value. To do that, you need to go through the AWS console.
         *
         *      gulp aws.env --env=staging --vars=CLIENT_VERSION:1432639096064
         *      aws opsworks update-app --app-id 5098939a-059e-478e-88a7-6f5966606e1b --environment "[{\"Key\":\"boo\",\"Value\":\"yeah\"}]"
         */
        env: function () {
            if (!env) {
                throw new Error('env param must be set for aws tasks');
            }

            var newVars = {};
            if (opts.vars) {
                _.each(opts.vars.split(','), function (keyValue) {
                    var keyValArr = keyValue.split(':');
                    var key = keyValArr[0];
                    newVars[key] = keyValArr[1];
                });
            }

            return aws.updateEnvironmentVariables(newVars, config.envVars, awsConfig);
        },

        /**
         * Deploy the latest
         *      gulp aws.deploy --target=web
         *      aws opsworks create-deployment --command "{\"Name\":\"deploy\"}" --stack-id "d008af15-b1ed-4a41-9d5d-d8f0028e0927" --instance-ids "7f50243f-9c58-4325-87d7-c1f3cc812d23" --app-id "5098939a-059e-478e-88a7-6f5966606e1b"
         */
        deploy: function () {
            if (!env) {
                throw new Error('env param must be set for aws tasks');
            }

            return aws.deploy(opts.vars, target, awsConfig);
        },

        /**
         * Rollback to a previous version
         *      gulp aws.rollback --target=web
         */
        rollback: function () {
            if (!env) {
                throw new Error('env param must be set for aws tasks');
            }

            return aws.rollbackDeployment(target, awsConfig);
        },

        /**
         * Restart the node app through pm2. Also, optionally pass in changes
         * to environment variables
         *      gulp aws.restart --target=api
         */
        restart: function () {
            if (!env) {
                throw new Error('env param must be set for aws tasks');
            }

            return aws.restartApp(opts.vars, target, awsConfig);
        }
    };
};