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

const MILEAGE_GL_DESCRIPTION = 'MILEAGE (kilometres traveled using personal vehicle)';
const NON_MILEAGE_GL_DESCRIPTION = 'OTHER (Miscellaneous expenses)';

Browser.site = 'http://localhost:9000';
var browser = new Browser();
browser.silent = true;

describe('new claims page', function () {
  this.timeout(3000);

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
      browser.assert.evaluate('expenseClaimApp;');
      browser.assert.evaluate('expenseClaimApp.costCentreNumber === "";');
      browser.assert.evaluate('expenseClaimApp.bankAccount === "";');
      browser.assert.evaluate('expenseClaimApp.items.length === 1;');
      browser.assert.evaluate('expenseClaimApp.items[0].date === "";');
      browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "";');
      browser.assert.evaluate('expenseClaimApp.items[0].numKm === "";');
      browser.assert.evaluate('expenseClaimApp.items[0].receipt.amount === "";');
      browser.assert.evaluate('expenseClaimApp.items[0].description === "";');
      browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

      // default is non-mileage related amounts so no numKm field at initialization
      browser.assert.evaluate('$(".num-km-info").data("bs.tooltip") === undefined');

      done();
    });
  });

  it('expenseClaimApp item totals are rounded to 2 decimal places', (done) => {
    browser.visit('/claims/new', () => {
      browser.evaluate('expenseClaimApp.previousMileage = 0');
      browser.assert.evaluate('expenseClaimApp.previousMileage === 0');
      browser.evaluate('expenseClaimApp.items[0].numKm === "";');
      browser.evaluate('expenseClaimApp.items[0].glDescription = "' + MILEAGE_GL_DESCRIPTION + '";');
      browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + MILEAGE_GL_DESCRIPTION + '";');

      async.waterfall([
        (callback) => {
          // 3439.3 * 0.54 = 1857.222 (round down)
          // wait for DOM to render from v-if
          browser.wait().then(() => {
            browser.fill('items[0][numKm]', '3439.3');
            browser.wait().then(() => {
              browser.assert.evaluate('expenseClaimApp.items[0].total === 1857.22');

              callback(null);
            });
          });
        },
        (callback) => {
          // 3439.2 * 0.54 = 1857.168 (round up)
          browser.fill('items[0][numKm]', '3439.2');
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].total === 1857.17');

            callback(null);
          });
        },
      ], (err) => {
        done();
      });
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
    var previousMileage;

    browser.visit('/claims/new', () => {
      async.waterfall([
        (callback) => {
          Employee.build({
            id: 1,
          }).getPreviousMileage().then((employeePreviousMileage) => {
            previousMileage = employeePreviousMileage;

            callback(null);
          });
        },
        (callback) => {
          // should take into account previous mileage only when mileage associated GL
          browser.evaluate('expenseClaimApp.items[0].glDescription = "' + MILEAGE_GL_DESCRIPTION + '";');
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + MILEAGE_GL_DESCRIPTION + '";');

          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.carryForwardMileage === ' + previousMileage.toString());

            callback(null);
          });
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
          var itemMileageAmounts = [2,3];

          _.each(itemMileageAmounts, (amount, index) => {
            browser.evaluate('expenseClaimApp.items[' + index.toString() + '].glDescription = "' + MILEAGE_GL_DESCRIPTION + '";');
            browser.assert.evaluate('expenseClaimApp.items[' + index.toString() + '].glDescription === "' + MILEAGE_GL_DESCRIPTION + '";');
            browser.evaluate('expenseClaimApp.items[' + index.toString() + '].numKm = ' + amount.toString());
          });

          var expectedItemsTotal = _.reduce(itemMileageAmounts, (acc, total) => {
            return acc + total;
          });

          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.carryForwardMileage === ' + expectedItemsTotal.toString());

            callback(null, itemMileageAmounts);
          });
        },
        (itemMileageAmounts, callback) => {
          // should revert back to previousMileage when changing to non-mileage item
          _.each(itemMileageAmounts, (amount, index) => {
            browser.evaluate('expenseClaimApp.items[' + index.toString() + '].glDescription = "' + NON_MILEAGE_GL_DESCRIPTION + '";');
            browser.assert.evaluate('expenseClaimApp.items[' + index.toString() + '].glDescription === "' + NON_MILEAGE_GL_DESCRIPTION + '";');
          });

          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.carryForwardMileage === ' + previousMileage + ';');

            callback(null);
          });
        },
      ], () => {
        done();
      });
    });
  });

  it('expenseClaimApp item creation adds tooltips', (done) => {
    browser.visit('/claims/new', () => {
      browser.assert.evaluate('expenseClaimApp.items.length === 1');

      async.waterfall([
        (callback) => {
          var numAddedItems = 1;
          for (var i = 0; i < numAddedItems; i++) {
            addExpenseClaimAppItem();
          }
          browser.wait().then(() => {
            // only for items with mileage associated GLs
            var mileageAssociatedGlDescription = MILEAGE_GL_DESCRIPTION;
            browser.evaluate('expenseClaimApp.items[1].glDescription = "' + mileageAssociatedGlDescription + '";');
            browser.assert.evaluate('expenseClaimApp.items[1].glDescription === "' + mileageAssociatedGlDescription + '";');

            browser.wait().then(() => {
              callback(null);
            });
          });
        },
        (callback) => {
          browser.assert.evaluate('$(".item").last().find(".num-km-info").data("bs.tooltip") !== undefined');

          callback(null);
        }
      ], () => {
        done();
      });
    });
  });

  it('expenseClaimApp item total is calculated from one of receipt and numKm but not both', (done) => {
    var mileageAssociatedGlDescription = MILEAGE_GL_DESCRIPTION;
    var nonMileageAssociatedGlDescription = NON_MILEAGE_GL_DESCRIPTION;
    var numKm = 65;
    var mileageRate = 0.54;
    var receiptAmount = 93;

    browser.visit('/claims/new', () => {
      async.waterfall([
        (callback) => {
          browser.assert.evaluate('expenseClaimApp.items.length === 1');

          callback(null);
        },
        (callback) => {
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "";');
          browser.assert.evaluate('expenseClaimApp.items[0].receipt.amount === "";');
          browser.assert.evaluate('expenseClaimApp.items[0].numKm === "";');
          browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

          // force previousMileage to zero
          browser.evaluate('expenseClaimApp.previousMileage = 0;');
          browser.assert.evaluate('expenseClaimApp.previousMileage === 0;');

          // change to kilometer based total
          browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');

            callback(null);
          });
        },
        (callback) => {
          // TODO make this dynamic based on configuration values for mileage
          // change number kilometers should change total value
          browser.fill('items[0][numKm]', numKm);
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].numKm === ' + numKm.toString() + ';');

            browser.assert.evaluate('expenseClaimApp.items[0].total === ' + (mileageRate * numKm).toString() + ';');

            callback(null);
          });
        },
        (callback) => {
          // change to non-kilometer based total should change total to non-kilometer based total
          browser.select('items[0][glDescription]', nonMileageAssociatedGlDescription);
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + nonMileageAssociatedGlDescription + '";');
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

            callback(null);
          });
        },
        (callback) => {
          // going back to kilometer based total should change total to previously calculated total
          browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');
            browser.assert.evaluate('expenseClaimApp.items[0].total === ' + (mileageRate * numKm).toString() + ';');

            callback(null);
          });
        },
        (callback) => {
          // changing to receipt based total should calculate based on receipt amount
          browser.select('items[0][glDescription]', nonMileageAssociatedGlDescription);
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + nonMileageAssociatedGlDescription + '";');
          browser.wait().then(() => {
            browser.fill('items[0][receipt][amount]', receiptAmount);
            browser.wait().then(() => {
              browser.assert.evaluate('expenseClaimApp.items[0].total === ' + receiptAmount.toString() + ';');

              callback(null);
            });
          });
        },
        (callback) => {
          // changing to kilometer based total and then back to non-kilometer based total should restore receipt based total
          browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');
          browser.wait().then(() => {
            browser.select('items[0][glDescription]', nonMileageAssociatedGlDescription);
            browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + nonMileageAssociatedGlDescription + '";');
            browser.wait().then(() => {
              browser.assert.evaluate('expenseClaimApp.items[0].total === ' + receiptAmount.toString() + ';');

              callback(null);
            });
          });
        },
      ], () => {
        done();
      });
    });
  });

  it('expenseClaimApp item total is calculated from one of receipt and numKm but not both', (done) => {
    var mileageAssociatedGlDescription = 'MILEAGE (kilometres traveled using personal vehicle)';
    var nonMileageAssociatedGlDescription = 'OTHER (Miscellaneous expenses)';
    var numKm = 65;
    var mileageRate = 0.54;
    var receiptAmount = 93;

    browser.visit('/claims/new', () => {
      async.waterfall([
        (callback) => {
          browser.assert.evaluate('expenseClaimApp.items.length === 1');

          callback(null);
        },
        (callback) => {
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "";');
          browser.assert.evaluate('expenseClaimApp.items[0].receipt.amount === "";');
          browser.assert.evaluate('expenseClaimApp.items[0].numKm === "";');
          browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

          // force previousMileage to zero
          browser.evaluate('expenseClaimApp.previousMileage = 0;');
          browser.assert.evaluate('expenseClaimApp.previousMileage === 0;');

          // change to kilometer based total
          browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');

            callback(null);
          });
        },
        (callback) => {
          // TODO make this dynamic based on configuration values for mileage
          // change number kilometers should change total value
          browser.fill('items[0][numKm]', numKm);
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].numKm === ' + numKm.toString() + ';');

            browser.assert.evaluate('expenseClaimApp.items[0].total === ' + (mileageRate * numKm).toString() + ';');

            callback(null);
          });
        },
        (callback) => {
          // change to non-kilometer based total should change total to non-kilometer based total
          browser.select('items[0][glDescription]', nonMileageAssociatedGlDescription);
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + nonMileageAssociatedGlDescription + '";');
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

            callback(null);
          });
        },
        (callback) => {
          // going back to kilometer based total should change total to previously calculated total
          browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
          browser.wait().then(() => {
            browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');
            browser.assert.evaluate('expenseClaimApp.items[0].total === ' + (mileageRate * numKm).toString() + ';');

            callback(null);
          });
        },
        (callback) => {
          // changing to receipt based total should calculate based on receipt amount
          browser.select('items[0][glDescription]', nonMileageAssociatedGlDescription);
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + nonMileageAssociatedGlDescription + '";');
          browser.wait().then(() => {
            browser.fill('items[0][receipt][amount]', receiptAmount);
            browser.wait().then(() => {
              browser.assert.evaluate('expenseClaimApp.items[0].total === ' + receiptAmount.toString() + ';');

              callback(null);
            });
          });
        },
        (callback) => {
          // changing to kilometer based total and then back to non-kilometer based total should restore receipt based total
          browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
          browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');
          browser.wait().then(() => {
            browser.select('items[0][glDescription]', nonMileageAssociatedGlDescription);
            browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + nonMileageAssociatedGlDescription + '";');
            browser.wait().then(() => {
              browser.assert.evaluate('expenseClaimApp.items[0].total === ' + receiptAmount.toString() + ';');

              callback(null);
            });
          });
        },
      ], () => {
        done();
      });
    });
  });

  it('expenseClaimApp item total from number of kilometers is calculated at different tiers of rates', (done) => {
    var mileageAssociatedGlDescription = 'MILEAGE (kilometres traveled using personal vehicle)';
    var nonMileageAssociatedGlDescription = 'OTHER (Miscellaneous expenses)';
    var numKm = 100;
    // TODO dynamic tests from fixtures
    var mileageRateInitial = 0.54;
    var mileageRateOverflow = 0.48;

    async.waterfall([
      (callback) => {
        browser.visit('/claims/new', () => {
          async.waterfall([
            (callback) => {
              browser.assert.evaluate('expenseClaimApp.items.length === 1');

              callback(null);
            },
            (callback) => {
              browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].receipt.amount === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].numKm === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

              // force previousMileage to zero
              browser.evaluate('expenseClaimApp.previousMileage = 0;');
              browser.assert.evaluate('expenseClaimApp.previousMileage === 0;');

              // change to kilometer based total
              browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
              browser.wait().then(() => {
                browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');

                callback(null);
              });
            },
            (callback) => {
              // TODO make this dynamic based on configuration values for mileage
              // total value should be calculated based on initial tier
              // wait for DOM to render from v-if
              browser.wait().then(() => {
                browser.fill('items[0][numKm]', numKm);
                browser.wait().then(() => {
                  browser.assert.evaluate('expenseClaimApp.items[0].numKm === ' + numKm.toString() + ';');

                  browser.assert.evaluate('expenseClaimApp.items[0].total === ' + (mileageRateInitial * numKm).toString() + ';');

                  callback(null);
                });
              });
            },
          ], () => {
            callback(null);
          });
        });
      },
      (callback) => {
        browser.visit('/claims/new', () => {
          async.waterfall([
            (callback) => {
              browser.assert.evaluate('expenseClaimApp.items.length === 1');

              callback(null);
            },
            (callback) => {
              browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].receipt.amount === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].numKm === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

              // force previousMileage to value for overflow tier rate
              var previousMileageValue = 6000;
              browser.evaluate('expenseClaimApp.previousMileage = ' + previousMileageValue.toString() + ';');
              browser.assert.evaluate('expenseClaimApp.previousMileage === ' + previousMileageValue.toString() + ';');

              // change to kilometer based total
              browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
              browser.wait().then(() => {
                browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');

                callback(null);
              });
            },
            (callback) => {
              // TODO make this dynamic based on configuration values for mileage
              // total value should be calculated based on overflow tier
              browser.fill('items[0][numKm]', numKm);
              browser.wait().then(() => {
                browser.assert.evaluate('expenseClaimApp.items[0].numKm === ' + numKm.toString() + ';');

                browser.assert.evaluate('expenseClaimApp.items[0].total === ' + (mileageRateOverflow * numKm).toString() + ';');

                callback(null);
              });
            },
          ], () => {
            callback(null);
          });
        });
      },
      (callback) => {
        browser.visit('/claims/new', () => {
          async.waterfall([
            (callback) => {
              browser.assert.evaluate('expenseClaimApp.items.length === 1');

              callback(null);
            },
            (callback) => {
              browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].receipt.amount === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].numKm === "";');
              browser.assert.evaluate('expenseClaimApp.items[0].total === 0;');

              // force previousMileage to value that will result in combination of initial and overflow tier rate
              var previousMileageValue = 4950;
              browser.evaluate('expenseClaimApp.previousMileage = ' + previousMileageValue.toString() + ';');
              browser.assert.evaluate('expenseClaimApp.previousMileage === ' + previousMileageValue.toString() + ';');

              // change to kilometer based total
              browser.select('items[0][glDescription]', mileageAssociatedGlDescription);
              browser.wait().then(() => {
                browser.assert.evaluate('expenseClaimApp.items[0].glDescription === "' + mileageAssociatedGlDescription + '";');

                callback(null);
              });
            },
            (callback) => {
              // TODO make this dynamic based on configuration values for mileage
              // change number kilometers should change total value based on combination of initial and overflow tiers
              browser.fill('items[0][numKm]', numKm);
              browser.wait().then(() => {
                browser.assert.evaluate('expenseClaimApp.items[0].numKm === ' + numKm.toString() + ';');

                browser.assert.evaluate('expenseClaimApp.items[0].total === ' + ((mileageRateInitial * 50) + (mileageRateOverflow * (numKm - 50))).toString() + ';');

                callback(null);
              });
            },
          ], () => {
            callback(null);
          });
        });
      },
    ], () => {
      done();
    });
  });
});

function addExpenseClaimAppItem() {
  browser.evaluate('$("#add-item").click()');
}
