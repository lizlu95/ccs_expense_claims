const assert = require('chai').assert;
const app = require('../../app');
const server = app.server;
const request = require('supertest');

describe('home page', function () {
  after(function () {
    server.close();
  });

  it('/logout should return 200', function (done) {
    request(app)
      .get('/logout')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          done();
        }
      });
  });
});
