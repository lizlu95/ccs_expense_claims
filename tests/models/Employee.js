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
        assert.equal(employee.managerId, manager.id);

        done();
      });
    });
  });

  it('employee without manager does not belong to a manager', function (done) {
    Employee.findById(2).then((employee) => {
      employee.getManager().then((manager) => {
        assert.equal(manager, null);

        done();
      });
    });
  });

  it('employee with no expense claims has no expense claims', function (done) {
    Employee.findById(1).then((employee) => {
      done();
    });
  });
});
