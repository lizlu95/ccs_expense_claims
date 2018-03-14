const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const Company = models.Company;

describe('company tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('company has many expense claims', function (done) {
    Company.findById(1).then((company) => {
      company.getExpenseClaims().then((expenseClaims) => {
        assert.isNotEmpty(expenseClaims);

        done();
      });
    });
  });
});
