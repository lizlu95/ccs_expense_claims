const assert = require('chai').assert;
const app = require('../../app');
const server = app.server;
const request = require('supertest');
const manager = require('../../fixtures/manager');

describe('employee tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('employees ', function (done) {
    done();
  });
});
