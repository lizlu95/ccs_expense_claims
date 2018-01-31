'use strict';

module.exports = (sequelize, DataTypes) => {
  var EmployeeExpenseClaim = sequelize.define('EmployeeExpenseClaim', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
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
    models.EmployeeExpenseClaim.belongsTo(models.Employee, {
      foreign_key: 'employee_id',
    });

    models.EmployeeExpenseClaim.belongsTo(models.ExpenseClaim, {
      foreign_key: 'expense_claim_id',
    });
  };

  return EmployeeExpenseClaim;
};
