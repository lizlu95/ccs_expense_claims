'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.addConstraint('approval_limits', ['employee_id', 'cost_centre_id'], {
      type: 'unique',
      name: 'employee_id_cost_centre_id_unique_idx',
    });
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.removeConstraint('approval_limits', 'employee_id_cost_centre_id_unique_idx');
  }
};
