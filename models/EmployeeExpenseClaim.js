'use strict';

module.exports = (sequelize, DataTypes) => {
  var EmployeeExpenseClaim = sequelize.define('EmployeeExpenseClaim', {
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
    },
    expenseClaimId: {
      type: DataTypes.INTEGER,
      field: 'expense_claim_id',
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      field: 'is_owner',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
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
    tableName: 'employees_expense_claims',
  });

  EmployeeExpenseClaim.associate = function (models) {
    EmployeeExpenseClaim.Employee = EmployeeExpenseClaim.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
    });

    EmployeeExpenseClaim.ExpenseClaim = EmployeeExpenseClaim.belongsTo(models.ExpenseClaim, {
      foreignKey: 'expense_claim_id',
    });

    EmployeeExpenseClaim.EmployeeExpenseClaims = EmployeeExpenseClaim.hasMany(models.EmployeeExpenseClaim, {
      foreignKey: 'expense_claim_id',
      targetKey: 'expense_claim_id',
    });
  };

  return EmployeeExpenseClaim;
};
