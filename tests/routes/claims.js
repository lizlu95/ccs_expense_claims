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
              .attach('items[0][receipt]', 'fixtures/images/flowers.jpg')
              .field('costCentreNumber', 0754)
              .field('bankAccount', '')
              .field('items[0][date]', '2000-01-01')
              .field('items[0][gl]', 2)
              .field('items[0][numKm]', 100)
              .field('items[0][description]', 'My First Expense Item')
              .field('items[0][total]', 200)
              .expect(302)
              .expect('Location', '/claims/' + (lastExpenseClaimId + 1))
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
