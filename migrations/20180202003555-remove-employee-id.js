'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'employees',
      'employee_id',
      Sequelize.STRING
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'employees',
      'employee_id',
      Sequelize.STRING
    );
  }
};
