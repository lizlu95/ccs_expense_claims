const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const models = require('../models/index');
const Configurations = models.Configuration;

/* GET /system/configuration */
router.get('/', function (req, res, next) {
  let configurationsData = {};
  Configurations.findAll().then(function (configurations) {
    for (let item of configurations) {
      configurationsData[item.dataValues.name] = item.dataValues.value;
    }
    res.render('admin/sysConfig',
               {
                 title: 'System Configuration',
                 max_per_diem_amount_data: configurationsData.max_per_diem_amount,
                 per_mileage_value_data: configurationsData.per_mileage_value,
                 max_per_meal_amount_data: configurationsData.max_per_meal_amount
               });
  });
});

/* POST /system/configuration */
router.post('/', function (req, res, next) {
  updateValues(req).then(function (nothing) {
    res.redirect('/system/configuration');
  });

});
// Configurations.update() return a promise, should wrap in Promise.all
updateValues = function (req) {
  return new Promise(function (fulfill, reject) {
    let pArr = [];
    if (req.body.newMaxDiem) {
      pArr.push(Configurations.update({
        value: req.body.newMaxDiem,
      }, {
        where: {
          name: 'max_per_diem_amount'
        }
      }));
    }
    if (req.body.newMileage) {
      pArr.push(Configurations.update({
        value: req.body.newMileage,
      }, {
        where: {
          name: 'per_mileage_value'
        }
      }));
    }
    if (req.body.newMeal) {
      pArr.push(Configurations.update({
        value: req.body.newMeal,
      }, {
        where: {
          name: 'max_per_meal_amount'
        }
      }));
    }
    Promise.all(pArr).then(function (nothing) {
      fulfill(nothing);
    }).catch(function (error) {
      /* TODO when input value is not value, such as too big or negative
         show the error message or display sth.
         (node:2160) UnhandledPromiseRejectionWarning: SequelizeDatabaseError: Out of range value for column 'value' at row 1 */
    });
  });
};

module.exports = router;
