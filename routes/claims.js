const async = require('async');
const express = require('express');
const router = express.Router();
const database = require('../database');
const _ = require('underscore');
const moment = require('moment');

const models = require('../models/index');
const ExpenseClaim = models.ExpenseClaim;
const ExpenseClaimItem = models.ExpenseClaimItem;

/* GET /claims/new */
router.get('/new', function (req, res, next) {
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
router.post('', function (req, res, next) {
  var expenseClaimItems = _.map(req.body.items, function (expenseClaimItem) {
    return {
      employeeId: req.user.id,
      date: moment().toString(),
      gl: expenseClaimItem.gl,
      numKm: expenseClaimItem.numKm,
      description: expenseClaimItem.description,
      amount: expenseClaimItem.amount,
      receipt: {
        path: expenseClaimItem.receipt,
      },
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
    costCentreId: req.body.costCentreId,
    expenseClaimItems: expenseClaimItems,
    employeesExpenseClaims: employeesExpenseClaims,
  };

  database.transaction(function (t) {
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
      res.redirect('/claims/' + expenseClaim.id);
    }).catch(function( err) {
      // TODO handle errors here.. is this how you pass to err handler?
      next(err);
    });
  });
});

module.exports = router;
