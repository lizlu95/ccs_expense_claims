'use strict';
const Op = require('sequelize').Op;

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
      return models.ExpenseClaim.findAll({
        include: [{
          model: models.EmployeeExpenseClaim,
          where: {
            employeeId: {
              [Op.eq]: this.id,
            },
          },
          isOwner: {
            [Op.eq]: true,
          },
        }],
      });
    };

    Employee.prototype.getManagedExpenseClaims = function () {
      return models.ExpenseClaim.findAll({
        include: [{
          model: models.EmployeeExpenseClaim,
          where: {
            employeeId: {
              [Op.eq]: this.id,
            },
          },
          isOwner: {
            [Op.eq]: false,
          },
        }],
      });
    };
  };

  return Employee;
};
