'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('receipts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      expenseClaimItemId: {
        type: Sequelize.INTEGER,
        field: 'expense_claim_item_id',
      },
      type: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at',
      },
    }, {
      underscored: true,
      tableName: 'receipts',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('receipts');
  }
};
