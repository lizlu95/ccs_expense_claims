const Browser = require('zombie');
const assert = require('chai').assert;
const helper = require('../../helper');
require('../../../index');
const async = require('async');
const manager = require('../../../seeds/manager');

const CLAIMS_NEW_ROUTE = '/claims/new';

Browser.site = 'http://localhost:9000';
var browser = new Browser();
browser.silent = true;

describe('new claims page', () => {
  before((done) => {
    manager.load(() => {
      helper.authenticate(browser, done);
    });
  });

  after(function (done) {
    manager.destroy(done);
  });

  it('expenseClaimApp component created with initial information and no items', (done) => {
    browser.visit('/claims/new', () => {
      browser.assert.evaluate('expenseClaimApp');
      browser.assert.evaluate('expenseClaimApp.costCentreNumber === ""');
      browser.assert.evaluate('expenseClaimApp.bankAccount === ""');
      browser.assert.evaluate('expenseClaimApp.items.length === 1');
      browser.assert.evaluate('expenseClaimApp.items[0].date === ""');
      browser.assert.evaluate('expenseClaimApp.items[0].glNumber === ""');
      browser.assert.evaluate('expenseClaimApp.items[0].numKm === 0');
      browser.assert.evaluate('expenseClaimApp.items[0].receipt === ""');
      browser.assert.evaluate('expenseClaimApp.items[0].description === ""');
      browser.assert.evaluate('expenseClaimApp.items[0].total === 0');

      browser.assert.evaluate('$(".num-km-info").data("bs.tooltip") !== undefined');

      done();
    });
  });
});
