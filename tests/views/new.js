const Browser = require('zombie');
const assert = require('chai').assert;
const helper = require('../helper');
require('../../index');

const CLAIMS_NEW_ROUTE = '/claims/new';

Browser.site = 'http://localhost:9000';
var browser = new Browser();

describe('new claims page', () => {
  it('expenseClaimApp component created with initial information and no items', (done) => {
    helper.withAuthenticate(browser, [
      function (browser, callback) {
        browser.visit('/claims/new', () => {
          browser.assert.evaluate('expenseClaimApp');

          callback(null);
        });
      },
    ], done);
  });
});
