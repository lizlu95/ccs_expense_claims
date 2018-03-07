const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const s = require('underscore.string');
const moment = require('moment');
const sequelize = require('../models/index').sequelize;
const Op = require('sequelize').Op;
const multipartMiddleware = require('connect-multiparty')();
const s3 = require('../s3');

const Notifier = require('../mixins/notifier');

const database = require('../models/index');
const Employee = database.Employee;
const ExpenseClaim = database.ExpenseClaim;
const ExpenseClaimItem = database.ExpenseClaimItem;
const EmployeeExpenseClaim = database.EmployeeExpenseClaim;
const CostCentre = database.CostCentre;
const GL = database.GL;
const Company = database.Company;
const Receipt = database.Receipt;
const ApprovalLimit = database.ApprovalLimit;

/* GET /claims */
router.get('', function (req, res, next) {
  res.locals.title = 'Claims';

  var employee = Employee.build({
    id: req.user.id,
  });

  var expenseClaimStatuses = [
    ExpenseClaim.STATUS.PENDING,
    ExpenseClaim.STATUS.APPROVED,
    ExpenseClaim.STATUS.REJECTED,
    ExpenseClaim.STATUS.FORWARDED,
  ];

  res.locals.expenseClaims = {};
  async.waterfall([
    (callback) => {
      employee.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
        res.locals.expenseClaims.submitted = submittedExpenseClaims;

        callback(null);
      });
    },
    (callback) => {
      employee.getManagedExpenseClaims().then((managedExpenseClaims) => {
        res.locals.expenseClaims.managed = managedExpenseClaims;

        callback(null);
      });
    }
  ], (err) => {
    if (err) {
      err = {
        message: 'Failed to find expense claims.',
        status: 404,
      };

      next(err);
    } else {
      res.render('claims/list');
    }
  });
});

/* GET /claims/new */
router.get('/new', function (req, res, next) {
  async.waterfall([
    function (callback) {
      res.locals.title = 'New Claim';

      res.locals.employeeName = req.user.name;
      res.locals.employeeId = req.user.id;

      callback(null);
    },
    function (callback) {
      Company.findAll().then((companies) => {
        res.locals.companyNames = _.map(companies, (company) => {
          return company.name;
        });

        callback(null);
      });
    },
    function (callback) {
      Employee.build({
        id: req.user.id,
      }).getPreviousMileage().then((previousMileage) => {
        res.locals.previousMileage = previousMileage;

        callback(null);
      });
    },
    function (callback) {
      CostCentre.findAll().then((costCentres) => {
        res.locals.costCentres = _.map(costCentres, (costCentre) => {
          return costCentre.number;
        });

        callback(null);
      });
    },
    function (callback) {
      GL.findAll().then((gls) => {
        res.locals.gls = _.map(gls, (gl) => {
          return {
            number: gl.number,
            description: gl.description,
          };
        });

        callback(null);
      });
    },
  ], function (err) {
    if (err) {
      next(err);
    } else {
      res.render('claims/new');
    }
  });
});

/* GET /claims/:id */
router.get('/:id', function (req, res, next) {
  var expenseClaimId = req.params.id;

  res.locals.title = 'Claim ' + expenseClaimId;
  // TODO
  async.waterfall([
    function (callback) {
      ExpenseClaim.findOne({
        where: {
          id: {
            [Op.eq]: req.params.id,
          },
        },
        include: [
          {
            model: EmployeeExpenseClaim,
            include: [
              Employee,
            ],
          },
          {
            model: ExpenseClaimItem,
            include: [
              Receipt,
              GL,
            ],
          },
          CostCentre,
        ],
      }).then((expenseClaim) => {
        if (expenseClaim) {
          // include submitter and active manager
          expenseClaim.submitter = _.find(expenseClaim.EmployeeExpenseClaims, (employeeExpenseClaim) => {
            return employeeExpenseClaim.isOwner &&
              employeeExpenseClaim.isActive;
          }).Employee;
          expenseClaim.activeManager = _.find(expenseClaim.EmployeeExpenseClaims, (employeeExpenseClaim) => {
            return !employeeExpenseClaim.isOwner &&
              employeeExpenseClaim.isActive;
          }).Employee;

          res.locals.expenseClaim = expenseClaim;

          callback(null, expenseClaim);
        } else {
          callback('Expense claim not found!');
        }
      });
    },
  ], function (err) {
    if (err) {
      err = {
        message: 'Failed to find expense claim!',
        status: 404,
      };

      next(err);
    } else {
      res.render('claims/detail');
    }
  });
});

/* POST /claims */
router.post('', multipartMiddleware, function (req, res, next) {
  // TODO cleanup temp files after connect-multiparty
  async.waterfall([
    function (callback) {
      CostCentre.findOne({
        where: {
          number: {
            [Op.eq]: req.body.costCentreNumber.toString(),
          }
        }
      }).then((costCentre) => {
        if (costCentre) {
          callback(null, costCentre);
        } else {
          callback('Failed to find cost centre!');
        }
      });
    },
    function (costCentre, callback) {
      var glDescriptions = _.map(req.body.items, function (item, index) {
        return item.glDescription;
      });

      GL.findAll({
        where: {
          description: {
            [Op.in]: glDescriptions,
          }
        }
      }).then((gls) => {
        if (!_.isEmpty(gls)) {
          callback(null, gls, costCentre);
        } else {
          callback('Failed to find one or more GLs!');
        }
      });
    },
    function (gls, costCentre, callback) {
      Company.findOne({
        where: {
          name: {
            [Op.eq]: req.body.companyName,
          },
        },
      }).then((company) => {
        callback(null, company, gls, costCentre);
      });
    },
    function (company, gls, costCentre, callback) {
      var items = _.map(req.body.items, function (item, index) {
        return _.extend(item, req.files.items[index]);
      });

      var employeeId = req.user.id;
      // TODO make sure employee without manager is a manager of self
      var managerId = req.user.managerId || req.user.id;

      var expenseClaimItems = _.map(items, function (item) {
        var gl = _.find(gls, function (gl) {
          return gl.description === item.glDescription;
        });
        var glId = null;
        if (gl) {
          glId = gl.id;
        }
        var model = {
          employeeId: employeeId,
          date: item.date,
          glId: glId,
          numKm: item.numKm || null,
          description: item.description,
          total: parseInt(item.total) || 0,
        };

        // TODO receipt path
        if (item.receipt.file.size !== 0) {
          // save temporary file

          _.extend(model, {
            Receipt: {
              path: item.receipt.file.path,
            },
          });
        };

        // remove temporary file

        return model;
      });

      if (expenseClaimItems.length < 1) {
        callback('No items provided for expense claim!');
      } else {
        var employeesExpenseClaims = [
          {
            employeeId: employeeId,
            isOwner: true,
            isActive: true,
          },
          {
            employeeId: managerId,
            isOwner: false,
            isActive: true,
          },
        ];

        var expenseClaim = {
          status: ExpenseClaim.STATUS.DEFAULT,
          bankAccount: req.body.bankAccount,
          costCentreId: costCentre.id,
          companyId: company.id,
          ExpenseClaimItems: expenseClaimItems,
          EmployeeExpenseClaims: employeesExpenseClaims,
        };

        sequelize.transaction(function (t) {
          return ExpenseClaim.create(expenseClaim, {
            include: [{
              association: ExpenseClaim.ExpenseClaimItems,
              include: [
                ExpenseClaimItem.Receipt,
              ],
            }, {
              association: ExpenseClaim.EmployeeExpenseClaims,
            }],
            transaction: t,
          }).then(function (expenseClaim) {
            var notifier = new Notifier();

            notifier.notifyExpenseClaimSubmitted(employeeId, managerId)
              .then((info) => {
                callback(null, expenseClaim);
              })
              .catch((err) => {
                // TODO flash message forward based on err
                callback(null, expenseClaim);
              });
          }).catch(function(err) {
            callback(err);
          });
        });
      }
    },
  ], function (err, expenseClaim) {
    if (err) {
      err = {
        message: 'Failed to create expense claim!',
        status: 409,
      };

      next(err);
    } else {
      res.redirect('/claims/' + expenseClaim.id);
    }
  });
});

/* POST /claims/:id */
// TODO PUT
router.post('/:id', function (req, res, next) {
  var expenseClaimId = req.params.id;
  // TODO make it a transaction then notify
  var status = req.body.status;

  res.locals.title = 'Claim ' + expenseClaimId;

  var updateAttributes = {};
  if (!_.isUndefined(status)) {
    updateAttributes['status'] = status;
  };

  new Promise(function (fulfill, reject) {
    let pArr = [];
    pArr.push(ExpenseClaim.update(updateAttributes, {
      where: {
        id: {
          [Op.eq]: expenseClaimId
        }
      }
    }));

    Promise.all(pArr).then(function (nothing) {
      fulfill(nothing);
    });
  }).then(function () {
    res.redirect('/claims/' + expenseClaimId);
  });
});

router.post('/:id/forward', function (req, res, next) {
  var expenseClaimId = req.params.id;

  async.waterfall([
    (callback) => {
      // only transact if current manager is removed and new manager is added
      sequelize.transaction(function (t) {
        return EmployeeExpenseClaim.update({
          isActive: false,
        }, {
          where: {
            expenseClaimId: {
              [Op.eq]: expenseClaimId,
            },
            isOwner: {
              [Op.eq]: 0,
            },
            isActive: {
              [Op.eq]: 1,
            },
          },
          transaction: t,
        }).then(function (employeeExpenseClaim) {
          var newEmployeeExpenseClaim = {
            employeeId: req.body.forwardee,
            expenseClaimId: expenseClaimId,
            isOwner: false,
            isActive: true,
          };
          return EmployeeExpenseClaim.create(newEmployeeExpenseClaim, {
            transaction: t,
          });
        }).then(function (employeeExpenseClaim) {
          var notifier = new Notifier(req);

          // TODO notify
        //  notifier.notifyExpenseClaimSubmitted(employeeId, managerId)
        //    .then((info) => {
        //      callback(null, expenseClaim);
        //    })
        //    .catch((err) => {
        //      // TODO flash message forward based on err
        //      callback(null, expenseClaim);
        //    });
          // TODO remove line below once notify
          callback(null);
        }).catch(function(err) {
          callback(err);
        });
      });
    },
  ], (err) => {
    if (err) {
      err = {
        message: 'Failed to create expense claim!',
        status: 409,
      };

      next(err);
    } else {
      res.redirect('/claims/' + expenseClaimId);
    }
  });
});

/* GET /claims/:id/forwardees */
router.get('/:id/forwardees', function (req, res, next) {
  var expenseClaimId = req.params.id;
  res.locals.title = 'Claim ' + expenseClaimId.toString() + ' Forwardees';

  findForwardees(expenseClaimId).then(function (forwardees) {
    let forwardeeIds = [];
    for (let forwardee of forwardees) {
      forwardeeIds.push(forwardee.employeeId);
    }
    res.locals.forwardeeIds = forwardeeIds;
    res.locals.expenseClaimId = expenseClaimId;

    res.render('claims/forwardees');
  });
});

var findForwardees = function (expenseClaimId) {
  var total = 0;
  return new Promise(function (fulfill, reject) {
    ExpenseClaim.findOne({
      where: {
        id: {
          [Op.eq]: expenseClaimId
        }
      }
    }).then(function (result) {
      ExpenseClaimItem.findAll(
        {
          where: {
            expenseClaimId: {
              [Op.eq]: expenseClaimId
            }
          }
        }
      ).then(function (items) {
        for (var expenseClaimItem of items) {
          total += expenseClaimItem.total;
        }
        ApprovalLimit.findAll(
          {
            where: {
              costCentreId: {
                [Op.eq]: result.costCentreId
              },
              limit: {
                [Op.gte]: total
              }
            }
          }
        ).then(function (value) {
          fulfill(value);
        });
      });
    });
    /*.then(function (abc) {
      console.log(abc)
      console.log("here ")
      ApprovalLimit.findAll(
      {
      where: {
      costCentreId: {
      [Op.eq]: abc.costCentreId
      },
      limit: {
      [Op.gte]: total
      }
      }
      }
      ).then(function (value) {
      //console.log(value);
      fulfill(value);
      })
      })*/;
  });
};

module.exports = router;
