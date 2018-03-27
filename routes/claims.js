const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const s = require('underscore.string');
const moment = require('moment');
const sequelize = require('../models/index').sequelize;
const Op = require('sequelize').Op;

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
const Configuration = database.Configuration;
const AutoSave = database.AutoSave;

/* GET /claims */
router.get('', function (req, res, next) {
  res.locals.title = 'Claims';

  var employee = Employee.build({
    id: req.user.id,
  });

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

/* GET /claims/save */
router.get('/save', function (req, res, next) {
  AutoSave.findOne({
    where: {
      employeeId: {
        [Op.eq]: req.user.id,
      },
    },
  }).then((autoSave) => {
    res.json(autoSave);
  });
});

/* GET /claims/new */
router.get('/new', function (req, res, next) {
  var employee = Employee.build({
    id: req.user.id,
  });
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
      employee.getPreviousMileage().then((previousMileage) => {
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
    function (callback) {
      Configuration.findAll().then((configurations) => {
        res.locals.configurations = _.object(_.map(configurations, (configuration) => {
          return [configuration.name, configuration.value];
        }));

        var maxPerDiem = _.find(res.locals.configurations, (value, name) => {
          return name === 'max_per_diem_amount';
        });

        callback(null, maxPerDiem);
      });
    },
    (maxPerDiem, callback) => {
      employee.getExpenseClaims({
        where: {
          createdAt: {
            [Op.between]: [moment().startOf('day').toDate(), moment().toDate()],
          },
        },
      }).then((expenseClaims) => {
        var expenseClaimIds = _.map(expenseClaims, (expenseClaim) => {
          return expenseClaim.id;
        });
        ExpenseClaimItem.findAll({
          where: {
            expenseClaimId: {
              [Op.in]: expenseClaimIds,
            },
          },
        }).then((expenseClaimItems) => {
          var dailyTotal = _.reduce(expenseClaimItems, (acc, expenseClaimItem) => {
            return acc + (expenseClaimItem.total || 0);
          }, 0);
          res.locals.maxPerDiemRemaining = maxPerDiem - dailyTotal;

          callback(null);
        });
      });
    }
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
  res.locals.s3BucketName = s3.config.params.Bucket;
  res.locals.s3Region = s3.config.region;

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
        order: [
          [
            EmployeeExpenseClaim,
            'createdAt',
            'ASC',
          ],
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

          // mark as forwarded for non-active managers
          if (expenseClaim.activeManager.id !== req.user.id &&
              expenseClaim.submitter.id !== req.user.id &&
              expenseClaim.status === ExpenseClaim.STATUS.PENDING) {
            expenseClaim.status = ExpenseClaim.STATUS.FORWARDED;
          }

          res.locals.expenseClaim = expenseClaim;

          callback(null, expenseClaim);
        } else {
          callback('Expense claim not found!');
        }
      });
    },
    (expenseClaim, callback) => {
      res.locals.isActiveManager = expenseClaim.activeManager.id === req.user.id;

      ExpenseClaimItem.findAll(
        {
          where: {
            expenseClaimId: {
              [Op.eq]: expenseClaim.id
            }
          }
        }
      ).then(function (items) {
        var total = 0;
        for (var expenseClaimItem of items) {
          total += expenseClaimItem.total;
        }

        ApprovalLimit.findAll(
          {
            where: {
              employeeId: {
                [Op.eq]: req.user.id,
              },
              costCentreId: {
                [Op.eq]: expenseClaim.costCentreId
              },
              limit: {
                [Op.gte]: total
              }
            }
          }
        ).then(function (approvalLimit) {
          if (!_.isEmpty(approvalLimit)) {
            res.locals.managerCanApprove = true;
          } else {
            res.locals.managerCanApprove = false;
          }

          callback(null, expenseClaim);
        });
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
router.post('', function (req, res, next) {
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
      var items = req.body.items;

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

        if (item.receipt && item.receipt.key.length > 0) {
          _.extend(model, {
            Receipt: {
              key: item.receipt.key,
              type: item.receipt.type,
            },
          });
        };

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
          bankNumber: req.body.bankNumber,
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
            AutoSave.destroy({
              where: {
                employeeId: {
                  [Op.eq]: req.user.id,
                },
              },
            }).then(() => {
              var notifier = new Notifier(req);
              notifier.notifyExpenseClaimSubmitted(employeeId, managerId, expenseClaim.id)
                .then((info) => {
                  callback(null, expenseClaim);
                })
                .catch((err) => {
                  // TODO flash message forward based on err
                  callback(null, expenseClaim);
                });
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

/* POST /save */
router.post('/save', function (req, res, next) {
  AutoSave.findOrCreate({
    where: {
      employeeId: req.user.id,
    },
  }).then((autoSave) => {
    autoSave[0].updateAttributes({
      data: req.body.expenseClaimData,
    }).then((autoSave) => {
      res.status(200).end();
    }).catch(() => {
      res.status(404).end();
    });
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
      ExpenseClaim.findOne({
        where: {
          id: {
            [Op.eq]: expenseClaimId,
          },
        },
      }).then((expenseClaim) => {
        EmployeeExpenseClaim.findOne({
          where: {
            expenseClaimId: {
              [Op.eq]: expenseClaimId,
            },
            isOwner: {
              [Op.eq]: 1,
            },
          },
        }).then((employeeExpenseClaim) => {
          var notifier = new Notifier(req);
          notifier.notifyExpenseClaimStatusChange(employeeExpenseClaim.employeeId, req.user.id, expenseClaimId, expenseClaim.status)
            .then(() => {
              fulfill(nothing);
            })
            .catch(() => {
              fulfill(nothing);
            });
        });
      });
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
          EmployeeExpenseClaim.findOne({
            where: {
              expenseClaimId: {
                [Op.eq]: expenseClaimId,
              },
              isOwner: {
                [Op.eq]: 1,
              },
            },
          }).then((employeeExpenseClaim) => {
            var notifier = new Notifier(req);
            notifier.notifyExpenseClaimForwarded(employeeExpenseClaim.employeeId, req.user.id, req.body.forwardee, expenseClaimId)
              .then((info) => {
                callback(null);
              })
              .catch((err) => {
                callback(null);
              });
          });
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

  findApprovalLimits(expenseClaimId, req.user.id).then(function (approvalLimits) {
    let forwardees = [];
    for (let approvalLimit of approvalLimits) {
      var employeeName = approvalLimit.Employee ? approvalLimit.Employee.name : '';
      forwardees.push({
        employeeId: approvalLimit.employeeId,
        employeeName: employeeName,
      });
    }
    res.locals.forwardees = forwardees;
    res.locals.expenseClaimId = expenseClaimId;

    res.render('claims/forwardees');
  });
});

var findApprovalLimits = function (expenseClaimId, forwardingEmployeeId) {
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
        // TODO: Add field for total of a claim?
        for (var expenseClaimItem of items) {
          total += expenseClaimItem.total;
        }
        ApprovalLimit.findAll(
          {
            where: {
              costCentreId: {
                [Op.eq]: result.costCentreId
              },
              employeeId: {
                [Op.ne]: forwardingEmployeeId,
              },
              limit: {
                [Op.gte]: total
              }
            },
            include: [
              Employee,
            ],
          }
        ).then(function (value) {
          fulfill(value);
        });
      });
    });
  });
};

module.exports = router;
