/**
 * Author: Jeff Whelpley
 * Date: 10/27/14
 *
 *
 */
var name    = 'jact';
var taste   = require('taste');
var target  = taste.target(name);

// we want to use undefined vars here since all the jyt funcs are on global
/* jshint undef:false */

describe('UNIT ' + name, function () {

    before(function () {

        // add all the jyt HTML function so the scope of this module
        target.addShortcutsToScope(global);

    });

    describe('render()', function () {
        it('should run without error', function () {
            target.render();
        });
    });
});

