'use strict';

module.exports = (sequelize, DataTypes) => {
  var ExpenseClaimItem = sequelize.define('ExpenseClaimItem', {
    expenseClaimId: {
      type: DataTypes.INTEGER,
      field: 'expense_claim_id',
    },
    name: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    isDeleted: {
      type: DataTypes.BOOLEAN,
      field: 'is_deleted',
    },
    receiptId: {
      type: DataTypes.INTEGER,
      field: 'receipt_id',
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
    models.ExpenseClaimItem.belongsTo(models.ExpenseClaim);
  };

  return ExpenseClaimItem;
};