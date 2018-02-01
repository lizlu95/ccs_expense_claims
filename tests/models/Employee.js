const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../fixtures/manager');

const models = require('../../models/index');
const Employee = models.Employee;

describe('employee tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('employee with manager belongs to a manager', function (done) {
    Employee.findById(1).then((employee) => {
      employee.getManager().then((manager) => {
        assert.equal(employee.managerId, manager.employeeId);

        done();
      });
    });
  });

  it('employee with no manager does not belong to a manager', function (done) {
    Employee.findById(2).then((employee) => {
      employee.getManager().then((manager) => {
        assert.isNull(manager);

        done();
      });
    });
  });

  it('manager with no managee(s) do not have any managees', function (done) {
    Employee.findById(1).then((employee) => {
      employee.getManagees().then((managees) => {
        assert.isEmpty(managees);

        done();
      });
    });
  });

  it('manager with managee(s) have managees', function (done) {
    Employee.findById(2).then((employee) => {
      employee.getManagees().then((managees) => {
        assert.isNotEmpty(managees);

        done();
      });
    });
  });

  it('employee with no expense claims has no expense claims', function (done) {
    Employee.findById(3).then((employee) => {
      employee.getExpenseClaims().then((expenseClaims) => {
        assert.isEmpty(expenseClaims);

        done();
      });
    });
  });

  it('employee with >= 1 expense claims has expense claims', function (done) {
    Employee.findById(1).then((employee) => {
      employee.getExpenseClaims().then((expenseClaims) => {
        assert.isNotEmpty(expenseClaims);

        done();
      });
    });
  });
});
