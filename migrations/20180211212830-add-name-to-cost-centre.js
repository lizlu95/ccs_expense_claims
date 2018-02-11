'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'cost_centres',
      'name',
      Sequelize.INTEGER
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'cost_centres',
      'name'
    );
  }
};
