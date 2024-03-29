const express = require('express');
const router = express.Router();
const Op = require('sequelize').Op;
const _ = require('underscore');

const database = require('../models/index');
const ApprovalLimit = database.ApprovalLimit;
const Employee = database.Employee;
const CostCentre = database.CostCentre;

let selected;
/* GET /limits */
router.get('', function (req, res, next) {
    res.locals.title = 'Limits';
    if(typeof selected === 'undefined') {
        Employee.findAll().then((employees) => {
            selected = [];
            for (let x of employees) {
                selected.push(x.id);
            }
            conditions = {
                where: {
                    employeeId: {
                        [Op.in]: selected,
                    },
                },
            };
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
    } else {
        var conditions = {};
        if (req.query.filter) {
            try {
                selected = JSON.parse('[' + req.query.filter + ']');
            } catch (error) {
            } finally {
                conditions = {
                    where: {
                        employeeId: {
                            [Op.in]: selected,
                        },
                    },
                };
            }
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
    }
});

/* GET /limits/new */
router.get('/new', function (req, res, next) {
  res.locals.title = 'New Limit';

  CostCentre.findAll().then((costCentres) => {
    res.locals.costCentres = costCentres;

    res.render('limits/new');
  });
});

/* POST /limits */
router.post('', function (req, res, next) {
  Employee.findOne({
    where: {
      id: {
        [Op.eq]: req.body.employeeId,
      },
    },
  }).then((employee) => {
    if (employee) {
      ApprovalLimit.create({
        employeeId: req.body.employeeId,
        costCentreId: req.body.costCentreId,
        limit: req.body.limit,
      }).then((approvalLimit) => {
        if (approvalLimit) {
          req.flash('success', 'Approval limit successfully created.');

          res.redirect('/limits/' + approvalLimit.id);
        } else {
          req.flash('error', 'Could not create approval limit.');

          res.redirect('/limits/new');
        }
      }).catch((error) => {
        req.flash('error', 'Validation error. Please ensure a unique entry.');

        res.redirect('/limits/new');
      });
    } else {
      req.flash('error', 'Could not find employee with id specified.');

      res.redirect('/limits/new');
    }
  });
});

/* GET /limits/:id/edit */
router.get('/:id/edit', function (req, res, next) {
  res.locals.title = 'Limit ' + req.params.id;

  CostCentre.findAll().then((costCentres) => {
    res.locals.costCentres = costCentres;

    ApprovalLimit.findOne({
      where: {
        id: {
          [Op.eq]: req.params.id,
        },
      },
      include: [
        Employee,
        CostCentre,
      ],
    }).then((approvalLimit) => {
      if (approvalLimit) {
        res.locals.approvalLimit = approvalLimit;

        res.render('limits/new');
      } else {
        req.flash('error', 'Could not find approval limit.');

        res.redirect('/limits');
      }
    });
  });
});

/* PUT /limits/:id */
router.put('/:id', function (req, res, next) {
  ApprovalLimit.findOne({
    where: {
      id: {
        [Op.eq]: req.params.id,
      },
    },
  }).then((approvalLimit) => {
    if (approvalLimit) {
      approvalLimit.updateAttributes({
        employeeId: req.body.employeeId,
        costCentreId: req.body.costCentreId,
        limit: req.body.limit,
      }).then(() => {
        req.flash('success', 'Successfully updated approval limit.');

        res.redirect('/limits/' + approvalLimit.id);
      }).catch(() => {
        req.flash('error', 'Failed to update approval limit.');

        res.redirect('/limits/' + approvalLimit.id);
      });
    } else {
      req.flash('error', 'Could not find approval limit.');

      res.redirect('/limits');
    }
  });
});

/* GET /limits/:id */
router.get('/:id', function (req, res, next) {
  res.locals.title = 'Limit ' + req.params.id;

  ApprovalLimit.findOne({
    where: {
      id: {
        [Op.eq]: req.params.id,
      },
    },
    include: [
      Employee,
      CostCentre,
    ],
  }).then((approvalLimit) => {
    if (approvalLimit) {
      res.locals.approvalLimit = approvalLimit;

      res.render('limits/detail.pug');
    } else {
      req.flash('error', 'Could not find approval limit.');

      res.redirect('/limits');
    }
  });
});

module.exports = router;
