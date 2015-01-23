/**
 * Author: Jeff Whelpley
 * Date: 1/22/15
 *
 * Simple task to re-initialize pancakes (usually called by watch)
 */
module.exports = function (gulp, opts) {
    if (!opts.pancakes || !opts.pancakesConfig) {
        throw new Error('Cannot reinit without pancakes and pancakesConfig');
    }

    return function () {
        opts.pancakes.init(opts.pancakesConfig);
    };
};


