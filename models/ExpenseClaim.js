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
    models.ExpenseClaim.hasMany(models.ExpenseClaimItem);

    models.ExpenseClaim.belongsToMany(models.Employee, {
      through: 'employees_expense_claims',
    });
  };

  return ExpenseClaim;
};
