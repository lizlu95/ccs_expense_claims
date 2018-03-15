const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');
const async = require('async');
const _ = require('underscore');

const models = require('../../models/index');
const Employee = models.Employee;
const ExpenseClaim = models.ExpenseClaim;
const EmployeeExpenseClaim = models.EmployeeExpenseClaim;

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

  it('employee with no approval limits has no approval limits', function (done) {
    Employee.findById(3).then((employee) => {
      employee.getApprovalLimits().then((approvalLimits) => {
        assert.isEmpty(approvalLimits);

        done();
      });
    });
  });

  it('employee with >= 1 approval limits has approval limits', function (done) {
    Employee.findById(1).then((employee) => {
      employee.getApprovalLimits().then((approvalLimits) => {
        assert.isNotEmpty(approvalLimits);

        done();
      });
    });
  });

  it('employee with no reports has no reports', function (done) {
    Employee.findById(3).then((employee) => {
      employee.getReports().then((reports) => {
        assert.isEmpty(reports);

        done();
      });
    });
  });

  it('employee with >= 1 reports has reports', function (done) {
    Employee.findById(1).then((employee) => {
      employee.getReports().then((reports) => {
        assert.isNotEmpty(reports);

        done();
      });
    });
  });

  it ('employee with >= 1 submitted expense claims has submitted expense claims with active manager attributes', (done) => {
    var employeeId = 1;
    Employee.findById(employeeId).then((employee) => {
      employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
        assert.isNotEmpty(submittedExpenseClaims);

        async.eachSeries(submittedExpenseClaims, (submittedExpenseClaim, callback) => {
          submittedExpenseClaim.getEmployeeExpenseClaims().then((employeeExpenseClaims) => {
            assert.exists(_.find(employeeExpenseClaims, (employeeExpenseClaim) => {
              return employeeExpenseClaim.employeeId === employeeId &&
                employeeExpenseClaim.isOwner &&
                employeeExpenseClaim.isActive;
            }));

            var managerEmployeeExpenseClaim = _.find(employeeExpenseClaims, (employeeExpenseClaim) => {
              return employeeExpenseClaim.employeeId !== employeeId &&
                !employeeExpenseClaim.isOwner &&
                employeeExpenseClaim.isActive;
            });
            assert.exists(managerEmployeeExpenseClaim);
            assert.equal(managerEmployeeExpenseClaim.employeeId, submittedExpenseClaim.activeManager.id);

            Employee.findById(submittedExpenseClaim.activeManager.id).then((manager) => {
              assert.equal(manager.name, submittedExpenseClaim.activeManager.name);

              callback(null);
            });
          });
        }, (err) => {
          done();
        });
      });
    });
  });

  it ('employee with >= 1 managed expense claims has managed expense claims with manager attributes attached to each', (done) => {
    var employeeId = 2;
    Employee.findById(employeeId).then((employee) => {
      employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
        assert.isNotEmpty(managedExpenseClaims);

        async.eachSeries(managedExpenseClaims, (managedExpenseClaim, callback) => {
          managedExpenseClaim.getEmployeeExpenseClaims().then((employeeExpenseClaims) => {
            assert.exists(_.find(employeeExpenseClaims, (employeeExpenseClaim) => {
              return employeeExpenseClaim.employeeId === employeeId &&
                !employeeExpenseClaim.isOwner;
            }));

            var submitterEmployeeExpenseClaim = _.find(employeeExpenseClaims, (employeeExpenseClaim) => {
              return employeeExpenseClaim.employeeId !== employeeId &&
                employeeExpenseClaim.isOwner &&
                employeeExpenseClaim.isActive;
            });
            assert.exists(submitterEmployeeExpenseClaim);
            assert.equal(submitterEmployeeExpenseClaim.employeeId, managedExpenseClaim.submitter.id);

            Employee.findById(managedExpenseClaim.submitter.id).then((submitter) => {
              assert.equal(submitter.name, managedExpenseClaim.submitter.name);

              callback(null);
            });
          });
        }, (err) => {
          done();
        });
      });
    });
  });

  it ('employee with >= 1 submitted expense claims but no managed expense claims has no managed expense claims', (done) => {
    var employeeId = 1;
    Employee.findById(employeeId).then((employee) => {
      employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
        assert.isNotEmpty(submittedExpenseClaims);

        employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
          assert.isEmpty(managedExpenseClaims);

          done();
        });
      });
    });
  });

  it ('employee with >= 1 managed expense claims but no submitted expense claims has no submitted expense claims', (done) => {
    var employeeId = 2;
    Employee.findById(employeeId).then((employee) => {
      employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
        assert.isNotEmpty(managedExpenseClaims);

        employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
          assert.isEmpty(submittedExpenseClaims);

          done();
        });
      });
    });
  });

  it ('employee with no managed expense claims and no submitted expense claims has 0 previous mileage', (done) => {
    var employeeId = 3;
    Employee.findById(employeeId).then((employee) => {
      employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
        assert.isEmpty(managedExpenseClaims);

        employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
          assert.isEmpty(submittedExpenseClaims);

          employee.getPreviousMileage().then((previousMileage) => {
            assert.equal(previousMileage, 0);

            done();
          });
        });
      });
    });
  });

  it ('employee with >= 1 managed expense claims but no submitted expense claims has 0 previous mileage', (done) => {
    var employeeId = 2;
    Employee.findById(employeeId).then((employee) => {
      employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
        assert.isNotEmpty(managedExpenseClaims);

        employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
          assert.isEmpty(submittedExpenseClaims);

          employee.getPreviousMileage().then((previousMileage) => {
            assert.equal(previousMileage, 0);

            done();
          });
        });
      });
    });
  });

  it ('employee with >= 1 submitted expense claims but no managed expense claims has previous mileage equal to the sum of their mileages', (done) => {
    var employeeId = 1;
    Employee.findById(employeeId).then((employee) => {
      employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
        assert.isNotEmpty(submittedExpenseClaims);

        employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
          assert.isEmpty(managedExpenseClaims);

          var expectedPreviousMileage = _.reduce(managedExpenseClaims, (acc, managedExpenseClaim) => {
            return acc + (managedExpenseClaim.numKm || 0);
          }, 0);

          employee.getPreviousMileage().then((previousMileage) => {
            assert.equal(expectedPreviousMileage, previousMileage);

            done();
          });
        });
      });
    });
  });

  it ('forwarded claims managed claim appears as status forwarded to manager but pending to the next manager', (done) => {
    var managedEmployeeId = 1;
    var managedEmployee = Employee.build({
      id: managedEmployeeId,
    });
    var forwardingEmployeeId = 2;
    var forwardingEmployee = Employee.build({
      id: forwardingEmployeeId,
    });
    var forwardeeEmployeeId = 3;
    var forwardeeEmployee = Employee.build({
      id: forwardeeEmployeeId,
    });

    var costCentreId = 1;
    var bankNumber = '';
    var status = ExpenseClaim.STATUS.DEFAULT;

    async.waterfall([
      (callback) => {
        // create expense claim
        ExpenseClaim.create({
          costCentreId: costCentreId,
          bankNumber: bankNumber,
          status: status,
          EmployeeExpenseClaims: [
            {
              employeeId: managedEmployeeId,
              isActive: true,
              isOwner: true,
            },
            {
              employeeId: forwardingEmployeeId,
              isActive: true,
              isOwner: false,
            },
          ],
        }, {
          include: [{
            association: ExpenseClaim.EmployeeExpenseClaims,
          }],
        }).then((expenseClaim) => {
          if (expenseClaim) {
            assert.equal(expenseClaim.status, ExpenseClaim.STATUS.PENDING);

            callback(null, expenseClaim);
          } else {
            callback('Could not create expense claim.');
          }
        });
      },
      (expenseClaim, callback) => {
        // should be pending for the current active employee and active manager
        async.waterfall([
          (callback) => {
            managedEmployee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
              var currentSubmittedExpenseClaim = _.find(submittedExpenseClaims, (submittedExpenseClaim) => {
                return submittedExpenseClaim.id === expenseClaim.id;
              });

              assert.isNotNull(currentSubmittedExpenseClaim);
              assert.equal(currentSubmittedExpenseClaim.status, ExpenseClaim.STATUS.PENDING);

              callback(null);
            });
          },
          (callback) => {
            forwardingEmployee.getManagedExpenseClaims().then((managedExpenseClaims) => {
              var currentManagedExpenseClaim = _.find(managedExpenseClaims, (managedExpenseClaim) => {
                return managedExpenseClaim.id === expenseClaim.id;
              });

              assert.isNotNull(currentManagedExpenseClaim);
              assert.equal(currentManagedExpenseClaim.status, ExpenseClaim.STATUS.PENDING);

              callback(null);
            });
          },
        ], (err) => {
          callback(err, expenseClaim);
        });
      },
      (expenseClaim, callback) => {
        // active manager forwards to another manager
        async.waterfall([
          (callback) => {
            EmployeeExpenseClaim.create({
              expenseClaimId: expenseClaim.id,
              employeeId: forwardeeEmployeeId,
              isActive: true,
              isOwner: false,
            }).then((employeeExpenseClaim) => {
              if (employeeExpenseClaim) {
                callback(null);
              } else {
                callback('Could not create employee expense claim.');
              }
            });
          },
          (callback) => {
            EmployeeExpenseClaim.update({
              isActive: false,
            }, {
              where: {
                expenseClaimId: expenseClaim.id,
                employeeId: forwardingEmployeeId,
              },
            }).then((employeeExpenseClaim) => {
              if (employeeExpenseClaim) {
                callback(null);
              } else {
                callback('Could not create employee expense claim.');
              }
            });
          },
        ], (err) => {
          callback(err, expenseClaim);
        });
      },
      (expenseClaim, callback) => {
        // status is pending/forwarded/pending for managed/forwarding/forwardee respsectively
        async.waterfall([
          (callback) => {
            managedEmployee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
              var currentSubmittedExpenseClaim = _.find(submittedExpenseClaims, (submittedExpenseClaim) => {
                return submittedExpenseClaim.id === expenseClaim.id;
              });

              assert.isNotNull(currentSubmittedExpenseClaim);
              assert.equal(currentSubmittedExpenseClaim.status, ExpenseClaim.STATUS.PENDING);

              callback(null);
            });
          },
          (callback) => {
            forwardingEmployee.getManagedExpenseClaims().then((managedExpenseClaims) => {
              var currentManagedExpenseClaim = _.find(managedExpenseClaims, (managedExpenseClaim) => {
                return managedExpenseClaim.id === expenseClaim.id;
              });

              assert.isNotNull(currentManagedExpenseClaim);
              assert.equal(currentManagedExpenseClaim.status, ExpenseClaim.STATUS.FORWARDED);

              callback(null);
            });
          },
          (callback) => {
            forwardeeEmployee.getManagedExpenseClaims().then((managedExpenseClaims) => {
              var currentManagedExpenseClaim = _.find(managedExpenseClaims, (managedExpenseClaim) => {
                return managedExpenseClaim.id === expenseClaim.id;
              });

              assert.isNotNull(currentManagedExpenseClaim);
              assert.equal(currentManagedExpenseClaim.status, ExpenseClaim.STATUS.PENDING);

              callback(null);
            });
          },
        ], (err) => {
          callback(err);
        });
      }
    ], (err) => {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });
});
