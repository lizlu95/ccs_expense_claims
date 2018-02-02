'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addColumn(
      'expense_claims',
      'cost_centre_id',
      Sequelize.INTEGER,
      {
        allowNull: false,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeColumn(
      'expense_claims',
      'cost_centre_id',
      Sequelize.INTEGER,
      {
        allowNull: false,
      }
    );
  },
};
