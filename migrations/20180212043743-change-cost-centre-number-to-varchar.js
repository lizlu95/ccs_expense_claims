'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'cost_centres',
      'number',
      {
        type: Sequelize.STRING,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'cost_centres',
      'number',
      {
        type: Sequelize.INTEGER,
      }
    );
  }
};
