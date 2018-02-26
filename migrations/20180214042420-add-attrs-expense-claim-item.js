'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'expense_claim_items',
      'date',
      Sequelize.DATE
    ).then(function () {
      return queryInterface.addColumn(
        'expense_claim_items',
        'gl_id',
        Sequelize.INTEGER
      ).then(function () {
        return queryInterface.addColumn(
          'expense_claim_items',
          'num_km',
          Sequelize.INTEGER
        ).then(function () {
          return queryInterface.renameColumn(
            'expense_claim_items',
            'name',
            'description'
          );
        });
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'expense_claim_items',
      'date'
    ).then(function () {
      return queryInterface.removeColumn(
        'expense_claim_items',
        'gl_id'
      ).then(function () {
        return queryInterface.removeColumn(
          'expense_claim_items',
          'num_km'
        ).then(function () {
          return queryInterface.renameColumn(
            'expense_claim_items',
            'description',
            'name'
          );
        });
      });
    });
  }
};
