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
const Report = models.Report;

describe('report tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('report with employee has an employee', function (done) {
    Report.findById(1).then((report) => {
      report.getEmployee().then((employee) => {
        assert.isNotNull(employee);

        done();
      });
    });
  });
});
