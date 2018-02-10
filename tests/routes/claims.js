const assert = require('chai').assert;
const app = require('../../app');
const request = require('supertest');
const async = require('async');
const helper = require('./../helper');
const manager = require('../../fixtures/manager');
const _ = require('underscore');

const models = require('../../models/index');
const ExpenseClaim = models.ExpenseClaim;

const CLAIMS_NEW_ROUTE = '/claims/new';

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
    helper.withAuthenticate([
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

  // TODO
  it('/claims POST with valid data creates a new expense claim', function (done) {
    helper.withAuthenticate([
      function (agent, callback) {
        agent
          .post('/claims')
          .send({
            managerId: 2,
            costCentreId: 2,
            bankAccount: '',
            items: [
              {
                date: '2000-01-01',
                gl: 2,
                numKm: 100,
                receipt: {
                  path: '',
                },
                description: 'My First Expense Item',
                amount: 2,
              },
              {
                date: '2000-02-02',
                gl: 2,
                numKm: 100,
                receipt: {
                  path: '',
                },
                description: 'My Second Expense Item',
                amount: 2,
              },
            ],
          })
          .expect(302)
          .expect('Location', '/\/claims\/.*/')
          .end(function (err, res) {
            if (err) {
              callback(err);
            } else {
              // expense claim will be the most recently created
              // NOTE assumes test is run in a single-threaded environment

              // TODO get latest created ExpenseClaim instance id
              agent
                .get('/claims/' + 1)
                .expect(200)
                .end(function (err, res) {
                  callback(err);
                });
            }
          });
      },
    ], done);
  });

  // TODO
  it('/claims POST with in-valid data does not create new expense claim', function (done) {
    helper.withAuthenticate([
      function (agent, callback) {
        agent
          .post(CLAIMS_NEW_ROUTE)
          .expect(400) // TODO ensure this is correct
          .end(function (err, res) {
            if (err) {
              callback(err);
            } else {
              // NOTE assumes test is run in a single-threaded environment
              async.waterfall([
                function (callback) {
                  ExpenseClaim.findOne({
                    order: [ [ 'createdAt', 'DESC' ] ],
                  }).then((expenseClaim) => {
                    if (expenseClaim) {
                      callback(null, expenseClaim);
                    } else {
                      callback('Failed to find latest expense claim.');
                    }
                  });
                }, function (expenseClaim, callback) {
                  agent
                    .get('/claims/' + id)
                    .expect(200)
                    .end(function (err, res) {
                      callback(err);
                    });
                }
              ]);
            }
          });
      },
    ], done);
  });
});
