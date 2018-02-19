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
      return getExpenseClaimsByJoinTable(models, this.id, true);
    };

    Employee.prototype.getManagedExpenseClaims = function () {
      return getExpenseClaimsByJoinTable(models, this.id, false);
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

function getExpenseClaimsByJoinTable(models, id, isOwner) {
  return models.ExpenseClaim.findAll({
    include: [{
      model: models.EmployeeExpenseClaim,
      where: {
        employeeId: {
          [Op.eq]: id,
        },
        isOwner: {
          [Op.eq]: isOwner,
        },
      },
    }],
  });
}
