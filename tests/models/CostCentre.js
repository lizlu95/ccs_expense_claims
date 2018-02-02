const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../fixtures/manager');
const _ = require('underscore');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;
const CostCentre = models.CostCentre;

describe('expense claim tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('cost centre with no expense claims has no expense claims', function (done) {
    CostCentre.findById(3).then((costCentre) => {
      costCentre.getExpenseClaims().then((expenseClaims) => {
        assert.isEmpty(expenseClaims);

        done();
      });
    });
  });

  it('cost centre with expense claims has many expense claims', function (done) {
    CostCentre.findById(1).then((costCentre) => {
      costCentre.getExpenseClaims().then((expenseClaims) => {
        assert(expenseClaims[0] instanceof ExpenseClaim);
        assert.isNotNull(expenseClaims);

        done();
      });
    });
  });
});
