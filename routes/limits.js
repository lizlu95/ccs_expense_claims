const express = require('express');
const router = express.Router();
const Op = require('sequelize').Op;
const _ = require('underscore');

const database = require('../models/index');
const ApprovalLimit = database.ApprovalLimit;
const Employee = database.Employee;
const CostCentre = database.CostCentre;

/* GET /limits */
router.get('', function (req, res, next) {
  res.locals.title = 'Limits';

  var conditions = {};
  if (req.query.filter) {
    conditions = {
      where: {
        id: {
          [Op.in]: JSON.parse('[' + req.query.filter + ']'),
        },
      },
    };
  }
  _.extend(conditions, {
    include: [
      Employee,
      CostCentre,
    ],
  });
  ApprovalLimit.findAll(conditions).then((approvalLimits) => {
    res.locals.approvalLimits = approvalLimits;

    res.render('limits/list');
  });
});

/* GET /limits/new */
router.get('/new', function (req, res, next) {
  res.locals.title = 'New Limit';

  CostCentre.findAll().then((costCentres) => {
    res.locals.costCentres = costCentres;

    res.render('limits/new');
  });
});

/* POST /limits/new */
router.post('', function (req, res, next) {
  ApprovalLimit.create({
    employeeId: req.body.employeeId,
    costCentreId: req.body.costCentreId,
    limit: req.body.limit,
  }).then((approvalLimit) => {
    if (approvalLimit) {
      res.redirect('/limits');
    } else {
      var err = {
        message: 'Could not create approval limit.',
        status: 500,
      };

      next(err);
    }
  });
});

module.exports = router;
