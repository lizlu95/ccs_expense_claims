'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.removeColumn(
      'employees',
      'employee_id',
      Sequelize.INTEGER
    );
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.addColumn(
      'employees',
      'employee_id',
      Sequelize.INTEGER
    );
  }
};
