const express = require('express');
const router = express.Router();
const Op = require('sequelize').Op;
const s3 = require('../s3');
const _ = require('underscore');
const sequelize = require('../models/index').sequelize;
const async = require('async');

const Notifier = require('../mixins/notifier');

const database = require('../models/index');
const Employee = database.Employee;
const ApprovalLimit = database.ApprovalLimit;
const CostCentre = database.CostCentre;
const Configuration = database.Configuration;

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
let selected;
/* GET /users */
router.get('', function (req, res, next) {
  res.locals.title = 'Users';
  if(typeof selected === 'undefined') {
      Employee.findAll().then((employees) => {
          selected = [];
          for (let x of employees) {
            selected.push(x.id);
          }
          Configuration.findOne({
              where: {
                  name: {
                      [Op.eq]: 'admin_employee_ids',
                  },
              },
          }).then((configuration) => {
              if (configuration) {
                  var adminIds = JSON.parse(configuration.value);
                  _.each(employees, (employee) => {
                      employee.isAdmin = _.contains(adminIds, employee.id);
                  });

                  res.locals.users = employees;
              }

              res.render('users/list');
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
                      id: {
                          [Op.in]: selected,
                      },
                  },
              };
          }
      }
      _.extend(conditions, {
          include: [{
              model: Employee,
              as: 'manager',
          }],
      });
      Employee.findAll(conditions).then((employees) => {
          Configuration.findOne({
              where: {
                  name: {
                      [Op.eq]: 'admin_employee_ids',
                  },
              },
          }).then((configuration) => {
              if (configuration) {
                  var adminIds = JSON.parse(configuration.value);
                  _.each(employees, (employee) => {
                      employee.isAdmin = _.contains(adminIds, employee.id);
                  });

                  res.locals.users = employees;
              }

              res.render('users/list');
          });
      });
  }
});

/* GET /users/new */
router.get('/new', function (req, res, next) {
  res.locals.title = 'New User';

  res.render('users/new');
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
    if (employee) {
      Configuration.findOne({
        where: {
          name: {
            [Op.eq]: 'admin_employee_ids',
          },
        },
      }).then((configuration) => {
        if (configuration) {
          var adminIds = JSON.parse(configuration.value);
          employee.isAdmin = _.contains(adminIds, employee.id);

          res.locals.user = employee;
        }

        res.render('users/detail');
      });
    } else {
      var err = {
        message: 'User not found.',
        status: 404,
      };

      next(err);
    }
  });
});

/* POST /users */
router.post('', function (req, res, next) {
  var newEmployeeId = req.body.id;
  var temporaryPassword = req.body.password;

  async.waterfall([
    (callback) => {
      if (req.body.managerId) {
        Employee.findOne({
          where: {
            id: {
              [Op.eq]: req.body.managerId,
            },
          },
        }).then((employee) => {
          if (employee) {
            callback(null);
          } else {
            callback('Could not find manager with specified ID.');
          }
        });
      } else {
        callback(null);
      }
    },
    (callback) => {
      sequelize.transaction(function (t) {
        var employeeAttributes = {
          id: newEmployeeId,
          name: req.body.name,
          email: req.body.email,
          password: temporaryPassword,
        };
        if (req.body.managerId) {
          _.extend(employeeAttributes, {
            managerId: req.body.managerId,
          });
        }
        return Employee.create(employeeAttributes, {
          transaction: t,
        }).then((employee) => {
          if (req.body.isAdmin) {
            return Configuration.findOne({
              where: {
                name: {
                  [Op.eq]: 'admin_employee_ids',
                },
              },
            }).then((configuration) => {
              return configuration.updateAttributes({
                value: '[' + JSON.parse(configuration.value).concat(newEmployeeId).toString() + ']',
              }, {
                transaction: t,
              });
            });
          } else {
            return Promise.resolve();
          }
        });
      }).then(() => {
        async.waterfall([
          (callback) => {
            var notifier = new Notifier(req);
            notifier.notifyNewEmployee(newEmployeeId, temporaryPassword)
              .then((info) => {
                callback(null);
              })
              .catch((err) => {
                callback(null);
              });
          },
        ], (err) => {
          callback(null, 'User successfully created.');
        });
      }).catch(() => {
        callback('Could not create user.');
      });
    },
  ], (err, success) => {
    if (err) {
      req.flash('error', err);

      res.redirect('/users/new');
    } else {
      req.flash('success', success);

      res.redirect('/users/' + newEmployeeId);
    }
  });
});

module.exports = router;
