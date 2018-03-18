const express = require('express');
const router = express.Router();
const Op = require('sequelize').Op;
const s3 = require('../s3');
const _ = require('underscore');

const database = require('../models/index');
const Employee = database.Employee;
const ApprovalLimit = database.ApprovalLimit;
const CostCentre = database.CostCentre;

/* GET /users/:id/signature */
router.get('/:id/signature', function (req, res, next) {
  var fileName = req.query.fileName;
  var contentType = req.query.contentType;
  if (fileName && contentType) {
    var fileKey = 'users/' + req.params.id + '/' + fileName;
    s3.getSignedUrlPromise('putObject', {
      Key: fileKey,
      ContentType: contentType,
    }).then((url) => {
      res.json({
        signedUrl: url,
      });
    }).catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
  } else {
    res.status(422).json({
      error: 'Invalid or missing parameters.'
    });
  }
});

/* GET /users */
router.get('', function (req, res, next) {
  res.locals.title = 'Users';

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
    include: [{
      model: Employee,
      as: 'manager',
    }],
  });
  Employee.findAll(conditions).then((employees) => {
    res.locals.users = employees;

    res.render('users/list');
  });
});

/* GET /users/:id */
router.get('/:id', function (req, res, next) {
  res.locals.title = 'User ' + req.params.id;

  Employee.findOne({
    where: {
      id: {
        [Op.eq]: req.params.id,
      },
    },
    include: [
      {
        model: ApprovalLimit,
        include: [
          CostCentre,
        ],
      },
      {
        model: Employee,
        as: 'manager',
      },
    ],
  }).then((employee) => {
    res.locals.user = employee;

    res.render('users/detail');
  });
});

module.exports = router;
