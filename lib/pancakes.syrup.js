/**
 * Author: Jeff Whelpley
 * Date: 1/20/15
 *
 * This module doesn't currently do anything besides build tasks, so main
 * module empty for now.
 */
var path    = require('path');
var delim   = path.normalize('/');

module.exports = {
    rootDir: __dirname.replace(delim + 'lib', '')
};