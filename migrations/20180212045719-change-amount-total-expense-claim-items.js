'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'expense_claim_items',
      'amount',
      'total'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'expense_claim_items',
      'total',
      'amount'
    );
  }
};
