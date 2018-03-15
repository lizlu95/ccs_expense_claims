'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'receipts',
      'path',
      'key'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'receipts',
      'key',
      'path'
    );
  }
};
