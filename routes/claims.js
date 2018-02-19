const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const s = require('underscore.string');
const moment = require('moment');
const sequelize = require('../models/index').sequelize;
const Op = require('sequelize').Op;
const multipartMiddleware = require('connect-multiparty')();

const models = require('../models/index');
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;
const EmployeeExpenseClaim = models.EmployeeExpenseClaim;
const CostCentre = models.CostCentre;
const GL = models.GL;

/* GET /claims */
router.get('', function (req, res, next) {
  res.locals.title = 'Claims';

  res.render('claims/list');
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
      EmployeeExpenseClaim.findAll({
        where: {
          employeeId: {
            [Op.eq]: req.user.id,
          },
          isOwner: {
            [Op.eq]: true,
          },
        },
      }).then((employeeExpenseClaims) => {
        var submittedExpenseClaimIds = _.map(employeeExpenseClaims, (employeeExpenseClaim) => {
          return employeeExpenseClaim.expenseClaimId;
        });

        // count mileage from all claims within current calendar year
        ExpenseClaimItem.findAll({
          where: {
            expenseClaimId: {
              [Op.in]: submittedExpenseClaimIds,
            },
            createdAt: {
              [Op.between]: [moment().startOf('year').toDate(), moment().toDate()],
            },
          },
        }).then((expenseClaimItems) => {
          res.locals.previousMileage = _.reduce(expenseClaimItems, (acc, expenseClaimItem) => {
            return acc + (expenseClaimItem.numKm || 0);
          }, 0);

          callback(null);
        });
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
      ExpenseClaim.findById(expenseClaimId).then((expenseClaim) => {
        if (expenseClaim) {
          res.locals.id = expenseClaimId;
          res.locals.status = s(expenseClaim.status).capitalize().value();

          callback(null, expenseClaim);
        } else {
          callback('Expense claim not found!');
        }
      });
    },
    function (expenseClaim, callback) {
      expenseClaim.getExpenseClaimItems().then((expenseClaimItems) => {
        if (expenseClaimItems) {
          res.locals.items = expenseClaimItems;

          callback(null, expenseClaim);
        } else {
          callback('Expense claim items not found!');
        }
      });
    },
    function (expenseClaim, callback) {
      CostCentre.findById(expenseClaim.costCentreId).then((costCentre) => {
        if (costCentre) {
          res.locals.costCentreNumber = costCentre.number;

          callback(null);
        } else {
          callback('Invalid cost centre!');
        }
      });
    },
    function (callback) {
      callback(null);
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
      var glNumbers = _.map(req.body.items, function (item, index) {
        return item.glNumber;
      });

      GL.findAll({
        where: {
          number: {
            [Op.in]: glNumbers,
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
      var items = _.map(req.body.items, function (item, index) {
        return _.extend(item, req.files.items[index]);
      });

      var employeeId = req.user.id;
      // TODO make sure employee without manager is a manager of self
      var managerId = req.user.managerId || req.user.id;

      var expenseClaimItems = _.map(items, function (item) {
        var gl = _.find(gls, function (gl) {
          return gl.number === parseInt(item.glNumber);
        });
        var glId = null;
        if (gl) {
          glId = gl.dataValues.id;
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
        if (item.receipt.size !== 0) {
          // save temporary file

          _.extend(model, {
            Receipt: {
              path: item.receipt.path,
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
            debugger;
            callback(null, expenseClaim);
          }).catch(function(err) {
            debugger;
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

module.exports = router;
