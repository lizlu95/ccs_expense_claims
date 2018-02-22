const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');
const sinon = require('sinon');
const rewire = require('rewire');
const _ = require('underscore');
const Promise = require('promise');
const YAML = require('yamljs');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;

const fixturesDirectory = 'fixtures/test/';
const fixturesRootKey = 'fixtures';
const fixturesDataKey = 'data';
const employeeFixtures = YAML.load(fixturesDirectory + 'Employee.yml')[fixturesRootKey];
const employeeOne = employeeFixtures[0][fixturesDataKey];
const employeeTwo = employeeFixtures[1][fixturesDataKey];

const Notifier = rewire('../../mixins/notifier');

describe('notifier tests', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('notifier class', function (done) {
    var notifier = new Notifier();

    assert(notifier.transporter);

    done();
  });

  it('notifyExpenseClaimSubmitted should send emails to approver and sender', (done) => {
    var notifier = new Notifier();

    // submitter is employeeOne
    var submitterTo = employeeOne.name + '<' + employeeOne.email + '>';
    var submitterSubject = 'Expense Claim Approval Submitted';
    var submitterMessage = 'Hello, please find your submitted request link below.';

    // approver is employeeTwo
    var approverTo = employeeTwo.name + '<' + employeeTwo.email + '>';
    var approverSubject = 'Expense Claim Approval Requested';
    var approverMessage = 'Hello, please find the attached link below.';

    var _notifyStub = sinon.stub().returns(Promise.resolve('info'));

    var _notifyOriginal = Notifier.__get__('_notify');

    Notifier.__set__('_notify', _notifyStub);

    var submitterNotifyExpenseClaimSubmittedArgs = [
      submitterTo,
      submitterSubject,
      submitterMessage,
    ];
    var approverNotifyExpenseClaimSubmittedArgs = [
      approverTo,
      approverSubject,
      approverMessage,
    ];
    notifier.notifyExpenseClaimSubmitted(employeeOne.id, employeeTwo.id).then(() => {
      _.each([submitterNotifyExpenseClaimSubmittedArgs, approverNotifyExpenseClaimSubmittedArgs], (args) => {
        assert.isTrue(_notifyStub.calledWithExactly.apply(_notifyStub, args));
        assert.isTrue(_notifyStub.calledTwice);
      });

      Notifier.__set__('_notify', _notifyOriginal);

      done();
    });
  });
});
