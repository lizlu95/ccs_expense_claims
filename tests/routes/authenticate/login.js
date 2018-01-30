const assert = require('chai').assert;
const app = require('../../../app');
const server = app.server;
const request = require('supertest');
const helper = require('../../helper');
const manager = require('../../../fixtures/manager');
const async = require('async');

describe('login page', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('/login should return 200 when not authenticated yet', function (done) {
    request(app)
      .get('/login')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });

  it('/login should redirect to homepage when authenticated', function (done) {
    var agent = request.agent(app);

    async.waterfall([
      function (callback) {
        helper.authenticate(agent, callback);
      },
      function (err, callback) {
        if (err) {
          done(err);
        } else {
          agent
            .get('/login')
            .expect(302)
            .expect('Location', '/')
            .end(function (err, res) {
              if (err) {
                done(err);
              } else {
                callback(null);

                done();
              }
            });
        }
      },
    ]);
  });
});
