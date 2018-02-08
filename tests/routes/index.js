const assert = require('chai').assert;
const app = require('../../app');
const request = require('supertest');
const async = require('async');
const helper = require('./../helper');
const manager = require('../../fixtures/manager');

describe('home page', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('/ should redirect to login when user is not authenticated', function (done) {
    request(app)
      .get('/')
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

  it('/ should 200 when user is authenticated', function (done) {
    helper.withAuthenticate([
      function(agent, callback) {
        agent
          .get('/')
          .expect(200)
          .end(function (err, res) {
            callback(err);
          });
      },
    ], done);
  });
});
