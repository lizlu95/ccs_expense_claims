'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('employees_expense_claims', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      employeeId: {
        type: Sequelize.INTEGER,
        field: 'employee_id',
      },
      expenseClaimId: {
        type: Sequelize.INTEGER,
        field: 'expense_claim_id',
      },
      isOwner: {
        type: Sequelize.INTEGER,
        field: 'is_owner',
      },
      isActive: {
        type: Sequelize.INTEGER,
        field: 'is_active',
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
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('employees_expense_claims');
  }
};
