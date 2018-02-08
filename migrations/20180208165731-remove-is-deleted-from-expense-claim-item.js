'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'expense_claim_items',
      'is_deleted'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'expense_claim_items',
      'is_deleted',
      Sequelize.BOOLEAN
    );
  }
};
