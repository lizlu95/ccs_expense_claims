const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');

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
    ExpenseClaim.findById(3).then((expenseClaim) => {
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

  it('expense claims with no claim items do not have any claim items', function (done) {
    ExpenseClaim.findById(2).then((expenseClaim) => {
      expenseClaim.getExpenseClaimItems().then((expenseClaimItems) => {
        assert.isEmpty(expenseClaimItems);

        done();
      });
    });
  });

  it('expense claims with >= 1 claimer(s)/approver(s) has relevant employees', function (done) {
    ExpenseClaim.findById(1).then((expenseClaim) => {
      expenseClaim.getExpenseClaimItems().then((expenseClaimItems) => {
        assert.isNotEmpty(expenseClaimItems);

        done();
      });
    });
  });

  it('expense claim belongs to cost centre', function (done) {
    ExpenseClaim.findById(1).then((expenseClaim) => {
      expenseClaim.getCostCentre().then((costCentre) => {
        assert.isNotNull(costCentre);

        done();
      });
    });
  });

  it('expense claim belongs to company', function (done) {
    ExpenseClaim.findById(1).then((expenseClaim) => {
      expenseClaim.getCompany().then((company) => {
        assert.isNotNull(company);

        done();
      });
    });
  });
});
