const express = require('express');
const router = express.Router();
const s3 = require('../s3');
const Op = require('sequelize').Op;

const database = require('../models/index');
const Employee = database.Employee;

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
  debugger;
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
  Employee.findAll(conditions).then((employees) => {
    res.locals.users = employees;

    res.render('users/list');
  });
});

module.exports = router;
