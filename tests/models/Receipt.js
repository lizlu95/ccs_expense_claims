const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');
const _ = require('underscore');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;
const CostCentre = models.CostCentre;
const Report = models.Report;
const Receipt = models.Receipt;

describe('receipt tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('report with expense claim items has many expense claim items', function (done) {
    Receipt.findById(1).then((receipt) => {
      receipt.getExpenseClaimItems().then((expenseClaimItems) => {
        assert.isNotEmpty(expenseClaimItems);

        done();
      });
    });
  });
});
