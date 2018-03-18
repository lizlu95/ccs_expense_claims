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

    res.render('limits');
  });
});

module.exports = router;
