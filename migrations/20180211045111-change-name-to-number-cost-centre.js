'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'cost_centres',
      'name',
      'number'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'cost_centres',
      'number',
      'name'
    );
  }
};
