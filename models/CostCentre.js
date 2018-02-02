'use strict';

const models = require('../models/index');

module.exports = (sequelize, DataTypes) => {
  var CostCentre = sequelize.define('CostCentre', {
    name: DataTypes.STRING
  }, {
    underscored: true,
    tableName: 'cost_centres',
  });

  CostCentre.associate = function (models) {
    models.CostCentre.hasMany(models.ExpenseClaim);
  };

  return CostCentre;
};
