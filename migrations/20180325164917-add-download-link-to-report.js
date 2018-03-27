'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.addColumn(
          'reports',
          'key',
          Sequelize.STRING
      );
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.removeColumn(
          'reports',
          'key',
          Sequelize.STRING
      );
  }
};
