'use strict';

module.exports = (sequelize, DataTypes) => {
  var ExpenseClaim = sequelize.define('ExpenseClaim', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.STRING,
    },
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
    tableName: 'expense_claims',
  });

  ExpenseClaim.associate = function (models) {
    ExpenseClaim.ExpenseClaimItems = ExpenseClaim.hasMany(models.ExpenseClaimItem);

    ExpenseClaim.CostCentre = ExpenseClaim.belongsTo(models.CostCentre);

    // used for Sequelize#create purposes via associations
    ExpenseClaim.EmployeesExpenseClaims = ExpenseClaim.hasMany(models.EmployeeExpenseClaim);

    ExpenseClaim.Employees = ExpenseClaim.belongsToMany(models.Employee, {
      through: 'employees_expense_claims',
    });
  };

  ExpenseClaim.STATUS = {
    DEFAULT: 'pending',
  };

  return ExpenseClaim;
};
