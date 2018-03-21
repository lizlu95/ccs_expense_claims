const express = require('express');
const router = express.Router();
const Op = require('sequelize').Op;
const _ = require('underscore');
const sequelize = require('sequelize');
const async = require('async');

const database = require('../models/index');
const Employee = database.Employee;

/* GET /settings */
router.get('', function (req, res, next) {
  res.locals.title = 'Settings';

  res.render('settings.pug');
});

/* POST /settings */
router.post('', function (req, res, next) {
  if (req.body.passwordInitial && req.body.passwordConfirm &&
      req.body.passwordInitial === req.body.passwordConfirm) {
    Employee.findOne({
      where: {
        id: req.user.id,
      },
    }).then((employee) => {
      if (employee) {
        async.waterfall([
          (callback) => {
            employee.updateAttributes({
              password: req.body.passwordInitial,
            }).then(() => {
              req.flash('success', 'Successfully updated password.');

              callback(null);
            }).catch(() => {
              req.flash('error', 'Failed to update password');

              callback(null);
            });
          },
        ], (err) => {
          res.redirect('/settings');
        });
      } else {
        req.flash('error', 'Failed to update password');

        res.redirect('/settings');
      }
    });
  } else {
    req.flash('error', 'Failed to update password');

    res.redirect('/settings');
  }
});

module.exports = router;
