const Browser = require('zombie');
const assert = require('chai').assert;
const helper = require('../helper');
require('../../index');

const CLAIMS_NEW_ROUTE = '/claims/new';

Browser.site = 'http://localhost:9000';
var browser = new Browser();
browser.silent = true;

describe('new claims page', () => {
  it('expenseClaimApp component created with initial information and no items', (done) => {
    helper.withAuthenticate(browser, [
      function (browser, callback) {
        browser.visit('/claims/new', () => {
          browser.assert.evaluate('expenseClaimApp');
          browser.assert.evaluate('expenseClaimApp.costCentreNumber === null');
          browser.assert.evaluate('expenseClaimApp.bankAccount === null');
          browser.assert.evaluate('expenseClaimApp.items.length === 1');
          browser.assert.evaluate('expenseClaimApp.items[0].date === null');
          browser.assert.evaluate('expenseClaimApp.items[0].glId === null');
          browser.assert.evaluate('expenseClaimApp.items[0].numKm === null');
          browser.assert.evaluate('expenseClaimApp.items[0].receipt === null');
          browser.assert.evaluate('expenseClaimApp.items[0].description === null');
          browser.assert.evaluate('expenseClaimApp.items[0].total === null');

          browser.assert.evaluate('$(".num-km-info").data("bs.tooltip") !== undefined');

          callback(null);
        });
      },
    ], done);
  });
});
