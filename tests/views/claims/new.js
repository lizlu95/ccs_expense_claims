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

  it('expenseClaimApp item added by clicking on Add Item and removed by clicking -', (done) => {
    browser.visit('/claims/new', () => {
      browser.assert.evaluate('expenseClaimApp.items.length === 1');

      var addItemSelector = '#add-item';
      var removeItemSelector = '#remove-item';

      async.waterfall([
        (callback) => {
          var numAddedItems = 2;
          for (var i = 0; i < numAddedItems; i++) {
            browser.evaluate('$("#add-item").click()');
          }
          browser.wait().then(() => {
            var totalItems = numAddedItems + 1;
            browser.assert.evaluate('expenseClaimApp.items.length === ' + totalItems.toString());

            browser.assert.evaluate('$(".item").length === ' + totalItems.toString());

            callback(null);
          });
        },
        (callback) => {
          browser.evaluate('expenseClaimApp.items[0].date = 0');
          browser.evaluate('expenseClaimApp.items[1].date = 1');
          browser.evaluate('expenseClaimApp.items[2].date = 2');

          browser.evaluate("$('#remove-item').first().click()");

          browser.evaluate('expenseClaimApp.items.length === 2');
          browser.evaluate('expenseClaimApp.items[0].date === 0');
          browser.evaluate('expenseClaimApp.items[1].date === 2');

          callback(null);
        },
      ], () => {
        done();
      });
    });
  });
});
