const assert = require('chai').assert;
const app = require('../../../app');
const async = require('async');
const request = require('supertest');
const helper = require('../../helper');
const manager = require('../../../fixtures/manager');

describe('logout page', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('/logout should redirect to login when not authenticated', function (done) {
    request(app)
      .get('/logout')
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

  it('/logout should log user out when authenticated', function (done) {
    var agent = request.agent(app);

    async.waterfall([
      function (callback) {
        helper.authenticate(agent, callback);
      },
      function (err, callback) {
        if (err) {
          done(err);
        } else {
          request(app)
            .get('/logout')
            .expect(302)
            .expect('Location', '/login')
            .end(function (err, res) {
              if (err) {
                done(err);
              }

              callback(null);
            });
        }
      },
      function (callback) {
        request(app)
          .get('/')
          .expect(302)
          .expect('Location', '/login')
          .end(function (err, res) {
            if (err) {
              done(err);
            } else {
              callback();

              done();
            }
          });
      },
    ]);
  });
});
