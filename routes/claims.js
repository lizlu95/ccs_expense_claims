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
  ExpenseClaim.findById(expenseClaimId).then((expenseClaim) => {
    if (expenseClaim) {
      res.locals.id = expenseClaimId;
      res.locals.status = expenseClaim.status;

      res.render('claims/detail');
    } else {
      next();
    }
  });
});

/* POST /claims */
router.post('', multipartMiddleware, function (req, res, next) {
  debugger;
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
          callback(null, costCentre.id);
        } else {
          callback('Failed to find cost centre!');
        }
      });
    },
    function (costCentreId, callback) {
      debugger;
      var expenseClaimItems = _.map(req.body.items, function (expenseClaimItem) {
        return {
          employeeId: req.user.id,
          date: expenseClaimItem.date,
          gl: expenseClaimItem.gl,
          numKm: expenseClaimItem.numKm,
          receipt: {
            path: expenseClaimItem.receipt,
          },
          description: expenseClaimItem.description,
          total: expenseClaimItem.total,
        };
      });

      var employeesExpenseClaims = [
        {
          employeeId: req.user.id,
          isOwner: true,
          isActive: true,
        },
        {
          employeeId: req.body.managerId,
          isOwner: false,
          isActive: true,
        },
      ];

      var expenseClaim = {
        status: ExpenseClaim.STATUS.DEFAULT,
        bankAccount: req.body.bankAccount,
        costCentreId: costCentreId,
        expenseClaimItems: expenseClaimItems,
        employeesExpenseClaims: employeesExpenseClaims,
      };

      sequelize.transaction(function (t) {
        ExpenseClaim.create(expenseClaim, {
          include: [{
            association: ExpenseClaim.ExpenseClaimItems,
            include: [
              ExpenseClaimItem.Receipt,
            ]
          }, {
            association: ExpenseClaim.EmployeesExpenseClaims,
          }]
        }, {
          transaction: t,
        }).then(function (expenseClaim) {
          callback(null);
        }).catch(function( err) {
          // TODO handle errors here.. is this how you pass to err handler?
          callback(err);
        });
      });
    },
  ], function (err, result) {
    if (err) {
      // TODO handle errors
      next(err);
    } else {
      res.redirect('/claims/' + expenseClaim.id);
    }
  });
});

module.exports = router;
