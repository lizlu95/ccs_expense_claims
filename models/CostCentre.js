'use strict';

const models = require('../models/index');

module.exports = (sequelize, DataTypes) => {
  var CostCentre = sequelize.define('CostCentre', {
    number: DataTypes.STRING,
  }, {
    underscored: true,
    tableName: 'cost_centres',
  });

  CostCentre.associate = function (models) {
    CostCentre.ExpenseClaims = CostCentre.hasMany(models.ExpenseClaim);

    CostCentre.ApprovalLimits = CostCentre.hasMany(models.ApprovalLimit);
  };

  return CostCentre;
};
