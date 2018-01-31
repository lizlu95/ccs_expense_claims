'use strict';

module.exports = (sequelize, DataTypes) => {
  var ExpenseClaim = sequelize.define('ExpenseClaim', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
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
    models.ExpenseClaim.belongsToMany(models.Employee, {
      through: 'employees_expense_claims',
      foreign_key: 'expense_claim_id',
    });

    models.ExpenseClaim.belongsToMany(models.Employee, {
      through: 'employees_expense_claims',
      foreign_key: 'employee_id',
    });
  };

  return ExpenseClaim;
};
