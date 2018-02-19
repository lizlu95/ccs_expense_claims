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

      done();
    });
  });

  it('expenseClaimApp item added by clicking on Add Item', (done) => {
    browser.visit('/claims/new', () => {
      browser.assert.evaluate('expenseClaimApp.items.length === 1');

      var addItemSelector = '#add-item';
      var removeItemSelector = '#remove-item';
      async.waterfall([
        function (callback) {
          browser.pressButton(addItemSelector, () => {
            browser.pressButton(addItemSelector, () => {
              browser.assert.evaluate('expenseClaimApp.items.length === 3');
              browser.assert.evaluate('$(".item").length === 3');

              callback(null);
            });
          });
        },
        function (callback) {
          browser.evaluate('expenseClaimApp.items[0].date = 0');
          browser.evaluate('expenseClaimApp.items[1].date = 1');
          browser.evaluate('expenseClaimApp.items[2].date = 2');

          browser.evaluate("$('#remove-item')[0].click()");

          browser.evaluate('expenseClaimApp.items.length === 2');
          browser.evaluate('expenseClaimApp.items[0].date === 0');
          browser.evaluate('expenseClaimApp.items[1].date === 2');

          callback(null);
        },
      ], function (err) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
    });
  });
});
