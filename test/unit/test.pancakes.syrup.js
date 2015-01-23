/**
 * Author: Jeff Whelpley
 * Date: 1/15/15
 *
 * This test is dumb for now, but just to have something here as placeholder
 */
var name    = 'lib/pancakes.syrup';
var taste   = require('taste');
var target  = taste.target(name);

describe('UNIT ' + name, function () {
    it('should be an empty object', function () {
        target.should.deep.equal({ rootDir: __dirname.replace('/test/unit', '') });
    });
});

