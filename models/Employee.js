'use strict';
const Op = require('sequelize').Op;
const _ = require('underscore');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  var Employee = sequelize.define('Employee', {
    managerId: {
      type: DataTypes.INTEGER,
      field: 'manager_id',
    },
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  }, {
    underscored: true,
    tableName: 'employees',
  });

  Employee.associate = function (models) {
    Employee.Manager = Employee.belongsTo(Employee, {
      foreignKey: 'manager_id',
      as: 'manager',
    });

    Employee.Managees = Employee.hasMany(Employee, {
      foreignKey: 'manager_id',
      as: 'managees',
    });

    Employee.ApprovalLimits = Employee.hasMany(models.ApprovalLimit);

    Employee.Reports = Employee.hasMany(models.Report);

    Employee.EmployeeExpenseClaims = Employee.hasMany(models.EmployeeExpenseClaim);

    Employee.ExpenseClaims = Employee.belongsToMany(models.ExpenseClaim, {
      through: 'employees_expense_claims',
    });

    Employee.prototype.getSubmittedExpenseClaims = function () {
      return this.getExpenseClaims({
        where: {
          '$EmployeeExpenseClaims.employee_id$': {
            [Op.eq]: this.id,
          },
          '$EmployeeExpenseClaims.is_owner$': {
            [Op.eq]: 1,
          }
        },
        include: [{
          model: models.EmployeeExpenseClaim,
          as: 'EmployeeExpenseClaims',
          include: [
            models.Employee,
          ]
        }],
      }).then((expenseClaims) => {
        var expenseClaimIds = _.map(expenseClaims, (expenseClaim) => {
          return expenseClaim.id;
        });

        return models.ExpenseClaim.findAll({
          where: {
            id: {
              [Op.in]: expenseClaimIds,
            },
          },
          include: [{
            model: models.EmployeeExpenseClaim,
            include: [
              models.Employee,
            ],
          }],
        }).then((expenseClaims) => {
          _.each(expenseClaims, (expenseClaim) => {
            var managerEmployeeExpenseClaim = _.find(expenseClaim.EmployeeExpenseClaims, (employeeExpenseClaim) => {
              return employeeExpenseClaim.employeeId !== this.id &&
                !employeeExpenseClaim.isOwner &&
                employeeExpenseClaim.isActive;
            });

            expenseClaim.activeManager = managerEmployeeExpenseClaim.Employee;
          });

          return expenseClaims;
        });
      });
    };

    Employee.prototype.getManagedExpenseClaims = function () {
      return this.getExpenseClaims({
        where: {
          '$EmployeeExpenseClaims.employee_id$': {
            [Op.eq]: this.id,
          },
          '$EmployeeExpenseClaims.is_owner$': {
            [Op.eq]: 0,
          }
        },
        include: [{
          model: models.EmployeeExpenseClaim,
          as: 'EmployeeExpenseClaims',
          include: [
            models.Employee,
          ]
        }],
      }).then((expenseClaims) => {
        var expenseClaimIds = _.map(expenseClaims, (expenseClaim) => {
          return expenseClaim.id;
        });

        return models.ExpenseClaim.findAll({
          where: {
            id: {
              [Op.in]: expenseClaimIds,
            },
          },
          include: [{
            model: models.EmployeeExpenseClaim,
            include: [
              models.Employee,
            ],
          }],
        }).then((expenseClaims) => {
          _.each(expenseClaims, (expenseClaim) => {
            var submitterEmployeeExpenseClaim = _.find(expenseClaim.EmployeeExpenseClaims, (employeeExpenseClaim) => {
              return employeeExpenseClaim.employeeId !== this.id &&
                employeeExpenseClaim.isOwner &&
                employeeExpenseClaim.isActive;
            });

            expenseClaim.submitter = submitterEmployeeExpenseClaim.Employee;
          });

          return expenseClaims;
        });
      });
    };

    Employee.prototype.getPreviousMileage = function () {
      return this.getSubmittedExpenseClaims().then((submittedExpenseClaims) => {
        var submittedExpenseClaimIds = _.map(submittedExpenseClaims, (submittedExpenseClaim) => {
          return submittedExpenseClaim.id;
        });

        // count mileage from all claims within current calendar year
        return models.ExpenseClaimItem.findAll({
          where: {
            expenseClaimId: {
              [Op.in]: submittedExpenseClaimIds,
            },
            createdAt: {
              [Op.between]: [moment().startOf('year').toDate(), moment().toDate()],
            },
          },
        }).then((expenseClaimItems) => {
          var employeePreviousMileage = _.reduce(expenseClaimItems, (acc, expenseClaimItem) => {
            return acc + (expenseClaimItem.numKm || 0);
          }, 0);

          return employeePreviousMileage;
        });
      });
    };
  };

  return Employee;
};
