const assert = require('chai').assert;
const app = require('../../app');
const request = require('supertest');
const async = require('async');
const helper = require('./../helper');
const manager = require('../../fixtures/manager');
const _ = require('underscore');

const CLAIMS_ROUTES = [
  '/claims/new',
];

describe('home page', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('/claims GET routes should redirect to login when user is not authenticated', function (done) {
    _.each(CLAIMS_ROUTES, function (route) {
      request(app)
        .get(route)
        .expect(302)
        .expect('Location', '/login')
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
    });
  });

  it('/claims GET routes should 200 when user is authenticated', function (done) {
    var agent = request.agent(app);

    async.waterfall([
      function (callback) {
        helper.authenticate(agent, callback);
      },
      function(err, callback) {
        if (err) {
          done(err);
        } else {
          _.each(CLAIMS_ROUTES, function (route) {
            agent
              .get(CLAIMS_ROUTES)
              .expect(200)
              .end(function (err, res) {
                if (err) {
                  done(err);
                } else {
                  done();
                }
              });
          });
        }
      },
    ]);
  });
});
