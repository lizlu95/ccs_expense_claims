const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../fixtures/manager');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;

describe('expense claim tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('expense claim item with expense claim belongs to expense claim', function (done) {
    ExpenseClaimItem.findById(1).then((expenseClaimItem) => {
      expenseClaimItem.getExpenseClaim().then((expenseClaim) => {
        assert(expenseClaim instanceof ExpenseClaim);
        assert.isNotNull(expenseClaim);

        done();
      });
    });
  });
});
