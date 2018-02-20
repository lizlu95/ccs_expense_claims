const Browser = require('zombie');
const assert = require('chai').assert;
const helper = require('../../helper');
require('../../../index');
const async = require('async');
const manager = require('../../../seeds/manager');
const _ = require('underscore');

const database = require('../../../models/index');
const Employee = database.Employee;

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
      browser.assert.evaluate('expenseClaimApp.items[0].glDescription === ""');
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
            addExpenseClaimAppItem();
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

  it('expenseClaimApp computes item total based on sum of item totals', (done) => {
    browser.visit('/claims/new', () => {
      browser.assert.evaluate('expenseClaimApp.itemsTotal === 0');

      async.waterfall([
        (callback) => {
          var numAddedItems = 2;
          for (var i = 0; i < numAddedItems; i++) {
            addExpenseClaimAppItem();
          }

          browser.wait().then(() => {
            var totalItems = numAddedItems + 1;
            browser.assert.evaluate('expenseClaimApp.items.length === ' + totalItems.toString());

            callback(null);
          });
        },
        (callback) => {
          _.each([[2,3], [-2, -4], [-2,4]], (amounts) => {
            _.each(amounts, (amount, index) => {
              browser.evaluate('expenseClaimApp.items[' + index.toString() + '].total = ' + amount.toString());
            });

            var expectedItemsTotal = _.reduce(amounts, (acc, total) => {
              return acc + total;
            });

            browser.assert.evaluate('expenseClaimApp.itemsTotal === ' + expectedItemsTotal.toString());
          });

          callback(null);
        },
      ], () => {
        done();
      });
    });
  });

  it('expenseClaimApp computes carry forward mileage based on sum of mileage added by expense claim', (done) => {
    browser.visit('/claims/new', () => {
      async.waterfall([
        (callback) => {
          Employee.build({
            id: 1,
          }).getPreviousMileage().then((previousMileage) => {
            callback(null, previousMileage);
          });
        },
        (previousMileage, callback) => {
          browser.assert.evaluate('expenseClaimApp.carryForwardMileage === ' + previousMileage.toString());

          callback(null);
        },
        (callback) => {
          var numAddedItems = 2;
          for (var i = 0; i < numAddedItems; i++) {
            addExpenseClaimAppItem();
          }

          browser.wait().then(() => {
            var totalItems = numAddedItems + 1;
            browser.assert.evaluate('expenseClaimApp.items.length === ' + totalItems.toString());

            callback(null);
          });
        },
        (callback) => {
          _.each([[2,3]], (amounts) => {
            _.each(amounts, (amount, index) => {
              browser.evaluate('expenseClaimApp.items[' + index.toString() + '].numKm = ' + amount.toString());
            });

            var expectedItemsTotal = _.reduce(amounts, (acc, total) => {
              return acc + total;
            });

            browser.assert.evaluate('expenseClaimApp.carryForwardMileage === ' + expectedItemsTotal.toString());
          });

          callback(null);
        },
      ], () => {
        done();
      });
    });
  });

  it('expenseClaimApp item creation adds tooltips', (done) => {
    browser.visit('/claims/new', () => {
      browser.assert.evaluate('expenseClaimApp.items.length === 1');

      var addItemSelector = '#add-item';
      var removeItemSelector = '#remove-item';

      async.waterfall([
        (callback) => {
          var numAddedItems = 1;
          for (var i = 0; i < numAddedItems; i++) {
            addExpenseClaimAppItem();
          }
          browser.wait().then(() => {
            browser.assert.evaluate('$(".item").last().find(".num-km-info").data("bs.tooltip") !== undefined');

            callback(null);
          });
        },
      ], () => {
        done();
      });
    });
  });
});

function addExpenseClaimAppItem() {
  browser.evaluate('$("#add-item").click()');
}
