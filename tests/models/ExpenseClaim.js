const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../fixtures/manager');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;

describe('expense claim tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('expense claims with no claimer(s)/approver(s) do not have any employees', function (done) {
    ExpenseClaim.findById(2).then((expenseClaim) => {
      expenseClaim.getEmployees().then((employees) => {
        assert.isEmpty(employees);

        done();
      });
    });
  });

  it('expense claims with >= 1 claimer(s)/approver(s) has relevant employees', function (done) {
    ExpenseClaim.findById(1).then((expenseClaim) => {
      expenseClaim.getEmployees().then((employees) => {
        assert.isNotEmpty(employees);

        done();
      });
    });
  });
});
