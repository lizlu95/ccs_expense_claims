'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'employees',
      'is_admin'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'employees',
      'is_admin',
      Sequelize.INTEGER
    );
  }
};
