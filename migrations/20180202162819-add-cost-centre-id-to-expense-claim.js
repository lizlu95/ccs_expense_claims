'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'expense_claims',
      'cost_centre_id',
      Sequelize.INTEGER,
      {
        allowNull: false,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'expense_claims',
      'cost_centre_id',
      Sequelize.INTEGER,
      {
        allowNull: false,
      }
    );
  },
};
