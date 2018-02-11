'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'receipts',
      'expense_claim_item_id'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'receipts',
      'expense_claim_item_id',
      Sequelize.INTEGER
    );
  }
};
