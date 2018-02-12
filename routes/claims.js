const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const moment = require('moment');
const sequelize = require('../models/index').sequelize;
const Op = require('sequelize').Op;
const multipartMiddleware = require('connect-multiparty')();

const models = require('../models/index');
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;
const CostCentre = models.CostCentre;

/* GET /claims */
router.get('', function (req, res, next) {
  res.render('claims/list');
});

/* GET /claims/new */
router.get('/new', function (req, res, next) {
  res.locals.title = 'Expense Claim';

  res.render('claims/new', { title: 'Expense Claim' });
});

/* GET /claims/:id */
router.get('/:id', function (req, res, next) {
  var expenseClaimId = req.params.id;

  // TODO
  async.waterfall([
    function (callback) {
      ExpenseClaim.findById(expenseClaimId).then((expenseClaim) => {
        if (expenseClaim) {
          res.locals.id = expenseClaimId;
          res.locals.status = expenseClaim.status;

          res.render('claims/detail');
        } else {
          next();
        }
      });
    },
    function (callback) {
    },
  ], function (err, result) {
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
            [Op.eq]: req.body.costCentreNumber,
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
      var items = _.map(req.body.items, function (item, index) {
        return _.extend(item, req.files.items[index]);
      });

      var employeeId = req.user.id;
      // TODO make sure employee without manager is a manager of self
      var managerId = req.user.managerId || req.user.id;

      var expenseClaimItems = _.map(items, function (item) {
        var model = {
          employeeId: employeeId,
          date: item.date,
          gl: item.gl,
          numKm: item.numKm,
          description: item.description,
          total: item.total,
        };

        // TODO receipt path
        if (!_.isEmpty(item.receipt.path)) {
          _.extend(model, {
            Receipt: {
              path: item.receipt.path,
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
            callback(null, expenseClaim);
          }).catch(function( err) {
            // TODO handle errors here.. is this how you pass to err handler?
            callback(err);
          });
        });
      }
    },
  ], function (err, expenseClaim) {
    if (err) {
      res.status = 409;

      res.render('error');
    } else {
      res.redirect('/claims/' + expenseClaim.id);
    }
  });
});

module.exports = router;
