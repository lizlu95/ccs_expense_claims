'use strict';

module.exports = (sequelize, DataTypes) => {
  var ExpenseClaimItem = sequelize.define('ExpenseClaimItem', {
    expenseClaimId: {
      type: DataTypes.INTEGER,
      field: 'expense_claim_id',
    },
    date: DataTypes.DATE,
    description: DataTypes.STRING,
    total: DataTypes.INTEGER,
    numKm: {
      type: DataTypes.INTEGER,
      field: 'num_km',
    },
    receiptId: {
      type: DataTypes.INTEGER,
      field: 'receipt_id',
    },
    glId: {
      type: DataTypes.INTEGER,
      field: 'gl_id',
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
    tableName: 'expense_claim_items',
  });

  ExpenseClaimItem.associate = function (models) {
    ExpenseClaimItem.Receipt = ExpenseClaimItem.belongsTo(models.Receipt);

    ExpenseClaimItem.ExpenseClaim = ExpenseClaimItem.belongsTo(models.ExpenseClaim);

    ExpenseClaimItem.GL = ExpenseClaimItem.belongsTo(models.GL, {
      foreignKey: 'gl_id',
    });
  };

  return ExpenseClaimItem;
};
