'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('expense_claim_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      expenseClaimId: {
        type: Sequelize.INTEGER,
        field: 'expense_claim_id',
      },
      name: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.INTEGER,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        field: 'is_deleted',
      },
      receiptId: {
        type: Sequelize.INTEGER,
        field: 'receipt_id',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at',
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at',
      },
    }, {
      underscored: true,
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('expense_claim_items');
  }
};
