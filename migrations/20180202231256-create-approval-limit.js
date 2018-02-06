'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('approval_limits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      employeeId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        field: 'employee_id',
      },
      costCentreId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        field: 'cost_centre_id',
      },
      limit: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at',
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at',
      },
    }, {
      underscored: true,
      tableName: 'approval_limits',
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('approval_limits');
  }
};
