'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'cost_centres',
      'name',
      {
        type: Sequelize.STRING,
      }
    ).then(function () {
      return queryInterface.changeColumn(
        'cost_centres',
        'number',
        {
          type: Sequelize.INTEGER,
        }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn(
      'cost_centres',
      'name',
      {
        type: Sequelize.INTEGER,
      }
    ).then(function () {
      return queryInterface.changeColumn(
        'cost_centres',
        'number',
        {
          type: Sequelize.STRING,
        }
      );
    });
  }
};
