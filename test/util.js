const assert = require('assert');
const utils = require('../util');

describe('Utils', function () {
    describe('#filterObject()', function () {
        it('Filter only missing values', function () {
            const attributes = {
                agility:   {die: '8'},
                awareness: {not_die: '8'},
                influence: {die: '6'},
                intellect: {die: 0},
                spirit:    {die: false},
                strength:  {die: null}
            };

            const expected = {
                agility:   {die: '8'},
                influence: {die: '6'},
            }

            assert.deepStrictEqual(expected, utils.filterObject(attributes, a => a.die));
        });
    });
});
