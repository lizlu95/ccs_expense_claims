const assert = require('chai').assert;
const app = require('../../../app');
const request = require('supertest');
const helper = require('../../helper');
const manager = require('../../../seeds/manager');
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

    helper.withAuthenticate(agent, [
      function (agent, callback) {
        agent
          .get('/login')
          .expect(302)
          .expect('Location', '/')
          .end(function (err, res) {
            callback(err);
          });
      },
    ], done);
  });

  it('/logging in after attempting to access page other than homepage redirects to that page after successful login', (done) => {
    var agent = request.agent(app);

    var initialUrl = '/claims/new';

    async.waterfall([
      (callback) => {
        agent
          .get(initialUrl)
          .expect(302)
          .expect('Location', '/login')
          .end((err, res) => {
            callback(null);
          });
      },
      (callback) => {
        helper.authenticate(agent, callback, initialUrl);
      },
    ], (err) => {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });
});
