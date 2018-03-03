'use strict';

module.exports = (sequelize, DataTypes) => {
  var Receipt = sequelize.define('Receipt', {
    key: {
      type: DataTypes.STRING,
    },
    type: {
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
    tableName: 'receipts',
  });

  Receipt.associate = function (models) {
    Receipt.ExpenseClaimItems = Receipt.hasMany(models.ExpenseClaimItem);
  };

  return Receipt;
};
