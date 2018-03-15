'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'expense_claims',
      'bank_number',
      {
        type: Sequelize.STRING,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'expense_claims',
      'bank_number',
      {
        type: Sequelize.INTEGER,
      }
    );
  }
};
