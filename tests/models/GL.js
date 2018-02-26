const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;
const GL = models.GL;

describe('GL tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('GL with many >= expense claim items has many expense claim items', function (done) {
    GL.findById(1).then((gl) => {
      gl.getExpenseClaimItems().then((expenseClaimItems) => {
        assert.isNotEmpty(expenseClaimItems);
        assert(expenseClaimItems[0] instanceof ExpenseClaimItem);

        done();
      });
    });
  });

  it('GL with many no expense claim items has none expense claim items', function (done) {
    GL.findById(2).then((gl) => {
      gl.getExpenseClaimItems().then((expenseClaimItems) => {
        assert.isEmpty(expenseClaimItems);

        done();
      });
    });
  });
});
