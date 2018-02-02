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
const ApprovalLimit = models.ApprovalLimit;

describe('approval limit tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('approval limit with employee has approval limits', function (done) {
    ApprovalLimit.findById(1).then((approvalLimit) => {
      approvalLimit.getEmployee().then((employee) => {
        assert.isNotNull(employee);

        done();
      });
    });
  });

  it('approval limit with cost centre has approval limits', function (done) {
    ApprovalLimit.findById(1).then((approvalLimit) => {
      approvalLimit.getCostCentre().then((costCentre) => {
        assert.isNotNull(costCentre);

        done();
      });
    });
  });
});
