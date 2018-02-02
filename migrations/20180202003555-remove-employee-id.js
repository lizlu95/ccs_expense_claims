'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.removeColumn(
      'expense_claims',
      'employee_id',
      Sequelize.STRING
    );
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.addColumn(
      'employees',
      'employee_id',
      Sequelize.STRING
    );
  }
};
