const assert = require('chai').assert;
const app = require('../../app');
const request = require('supertest');
const async = require('async');
const helper = require('./../helper');
const manager = require('../../seeds/manager');
const _ = require('underscore');
const Op = require('sequelize').Op;
const YAML = require('yamljs');

const models = require('../../models/index');
const ExpenseClaim = models.ExpenseClaim;
const CostCentre = models.CostCentre;

const fixturesDirectory = 'fixtures/test/';
const fixturesRootKey = 'fixtures';
const fixturesDataKey = 'data';
const employeeFixtures = YAML.load(fixturesDirectory + 'Employee.yml')[fixturesRootKey];
const companyFixtures = YAML.load(fixturesDirectory + 'Company.yml')[fixturesRootKey];
const costCentreFixtures = YAML.load(fixturesDirectory + 'CostCentre.yml')[fixturesRootKey];
const employeeOne = employeeFixtures[0][fixturesDataKey];
const employeeTwo = employeeFixtures[1][fixturesDataKey];
const companyOne = companyFixtures[0][fixturesDataKey];
const companyTwo = companyFixtures[1][fixturesDataKey];
const costCentreOne = costCentreFixtures[0][fixturesDataKey];
const costCentreTwo = costCentreFixtures[1][fixturesDataKey];

const CLAIMS_NEW_ROUTE = '/claims/new';
const CLAIMS_LIST_ROUTE = '/claims';

const CLAIMS_ROUTES = [
  CLAIMS_NEW_ROUTE,
];

describe('home page', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('/claims GET routes should redirect to login when user is not authenticated', function (done) {
    async.eachSeries(CLAIMS_ROUTES, function (claimRoute, callback) {
      request(app)
        .get(claimRoute)
        .expect(302)
        .expect('Location', '/login')
        .end(function (err, res) {
          callback(err);
        });
    }, function (err) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('/claims GET routes should 200 when user is authenticated', function (done) {
    var agent = request.agent(app);

    helper.withAuthenticate(agent, [
      function (agent, callback) {
        async.eachSeries(CLAIMS_ROUTES, function (claimRoute, callback) {
          agent
            .get(claimRoute)
            .expect(200)
            .end(function (err, res) {
              callback(err);
            });
        }, function (err) {
          callback(err);
        });
      },
    ], done);
  });

  it('/claims POST with valid data creates a new expense claim and redirects to new expense claim', function (done) {
    var agent = request.agent(app);

    helper.withAuthenticate(agent, [
      function (agent, callback) {
        // NOTE assumes test is run in a single-threaded environment
        async.waterfall([
          function (callback) {
            ExpenseClaim.findAll({
              limit: 1,
              order: [ [ 'id', 'DESC' ] ],
            }).then(function (expenseClaims) {
              if (expenseClaims) {
                callback(null, expenseClaims[0].id);
              } else {
                callback(err);
              }
            });
          },
          function (lastExpenseClaimId, callback) {
            var nextExpenseClaimId = lastExpenseClaimId + 1;

            // create an expense claim with two items
            //   - one item with GL associated with Receipt
            //   - one item with GL associated with numKm
            var costCentreNumber = costCentreOne['number'];
            var bankAccount = '';
            var companyName = companyOne['name'];
            var items = [
              {
                date: '2000-01-01',
                gl: {
                  number: '663400',
                  description: 'HOTEL (Room only, NO FOOD)',
                },
                receipt: {
                  path: 'fixtures/files/flowers.jpg',
                  size: 100,
                },
                numKm: 0,
                description: 'My First Expense Claim Item',
                total: 200,
              },
              {
                date: '2001-02-30',
                gl: {
                  number: '663400',
                  description: 'MILEAGE (kilometres traveled using personal vehicle)',
                },
                receipt: {
                  path: 'fixtures/files/empty.txt',
                  size: 0,
                },
                numKm: 100,
                description: 'My Second Expense Claim Item',
                total: 200,
              }
            ];
            agent
              .post(CLAIMS_LIST_ROUTE)
              .field('costCentreNumber', costCentreNumber)
              .field('bankAccount', bankAccount)
              .field('companyName', companyName)
              .attach('items[0][receipt][file]', items[0].receipt.path)
              .field('items[0][date]', items[0].date)
              .field('items[0][glDescription]', items[0].gl.description)
              .field('items[0][numKm]', items[0].numKm)
              .field('items[0][description]', items[0].description)
              .field('items[0][total]', items[0].total)
              .attach('items[1][receipt][file]', items[1].receipt.path)
              .field('items[1][date]', items[1].date)
              .field('items[1][glDescription]', items[1].gl.description)
              .field('items[1][numKm]', items[1].numKm)
              .field('items[1][description]', items[1].description)
              .field('items[1][total]', items[1].total)
              .expect(302)
              .expect('Location', '/claims/' + nextExpenseClaimId)
              .end(function (err, res) {
                async.waterfall([
                  function (callback) {
                    ExpenseClaim.findById(nextExpenseClaimId).then((expenseClaim) => {
                      if (expenseClaim) {
                        CostCentre.findOne({
                          where: {
                            number: {
                              [Op.eq]: costCentreNumber,
                            },
                          },
                        }).then((costCentre) => {
                          if (costCentre) {
                            if (expenseClaim.costCentreId === costCentre.id) {
                              callback(null, expenseClaim);
                            } else {
                              callback('Expense claim was created with incorrect attribuets!');
                            }
                          }
                        });
                      } else {
                        callback('Could not find new expense claim record in database!');
                      };
                    });
                  },
                  function (expenseClaim, callback) {
                    // proper owner/manager associations
                    expenseClaim.getEmployeeExpenseClaims().then((employeeExpenseClaims) => {
                      var creatorAssociation = _.any(employeeExpenseClaims, (employeeExpenseClaim) => {
                        return employeeExpenseClaim.employeeId === 1 &&
                          employeeExpenseClaim.isOwner &&
                          employeeExpenseClaim.isActive;
                      });
                      var managerAssociation = _.any(employeeExpenseClaims, (employeeExpenseClaim) => {
                        return employeeExpenseClaim.employeeId === 2 &&
                          !employeeExpenseClaim.isOwner &&
                          employeeExpenseClaim.isActive;
                      });
                      if (employeeExpenseClaims.length === 2 && creatorAssociation && managerAssociation) {
                        callback(null, expenseClaim);
                      } else {
                        callback('Associations on expense claim not correctly created!');
                      }
                    });
                  },
                  function (expenseClaim, callback) {
                    // proper items creation and associations
                    expenseClaim.getExpenseClaimItems().then((expenseClaimItems) => {
                      var receiptExpenseClaimItem = _.find(expenseClaimItems, (expenseClaimItem) => {
                        var receiptItem = items[0];
                        return receiptItem.numKm === expenseClaimItem.numKm &&
                          receiptItem.description === expenseClaimItem.description &&
                          receiptItem.total === expenseClaimItem.total;
                      });
                      var kmExpenseClaimItem = _.find(expenseClaimItems, (expenseClaimItem) => {
                        var kmItem = items[1];
                        return kmItem.numKm === expenseClaimItem.numKm &&
                          kmItem.description === expenseClaimItem.description &&
                          kmItem.total === expenseClaimItem.total;
                      });
                      if (expenseClaimItems.length === items.length && receiptExpenseClaimItem && kmExpenseClaimItem) {
                        callback(err, receiptExpenseClaimItem, kmExpenseClaimItem);
                      } else {
                        callback('Could not find associated expense claim items with new expense claim!');
                      }
                    });
                  },
                  function (receiptExpenseClaimItem, kmExpenseClaimItem, callback) {
                    async.waterfall([
                      function (callback) {
                        kmExpenseClaimItem.getReceipt().then((receipt) => {
                          if (receipt) {
                            callback('Found receipt for expense claim item without receipt!');
                          } else {
                            callback(null);
                          }
                        });
                      },
                      function (callback) {
                        receiptExpenseClaimItem.getReceipt().then((receipt) => {
                          if (receipt) {
                            var receiptItem = items[0];
                            if (receiptItem.size === receipt.size) {
                              callback(null);
                            } else {
                              callback('Found receipt item associated with expense claim item with wrong size!');
                            }
                          } else {
                            callback('Did not find associated receipt for expense claim item with receipt!');
                          }
                        });
                      },
                    ], function (err) {
                      callback(err);
                    });
                  }
                ], function (err) {
                  callback(err);
                });
              });
          },
        ], function (err) {
          callback(err);
        });
      },
    ], done);
  });

  it('/claims POST with invalid data creates a new expense claim and redirects to new expense claim', function (done) {
    var agent = request.agent(app);

    helper.withAuthenticate(agent, [
      function (agent, callback) {
        // NOTE assumes test is run in a single-threaded environment
        async.waterfall([
          function (callback) {
            ExpenseClaim.findAll({
              limit: 1,
              order: [ [ 'id', 'DESC' ] ],
            }).then(function (expenseClaims) {
              if (expenseClaims) {
                callback(null, expenseClaims[0].id);
              } else {
                callback(err);
              }
            });
          },
          function (lastExpenseClaimId, callback) {
            agent
              .post(CLAIMS_LIST_ROUTE)
              .attach('items[0][receipt][file]', 'fixtures/files/flowers.jpg')
              .field('costCentreNumber', '0754')
              .field('bankAccount', '')
              .expect(409)
              .end(function (err, res) {
                callback(err);
              });
          },
        ], function (err) {
          callback(err);
        });
      },
    ], done);
  });
});
