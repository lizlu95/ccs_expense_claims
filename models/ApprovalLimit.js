'use strict';

const models = require('../models/index');

module.exports = (sequelize, DataTypes) => {
  var ApprovalLimit = sequelize.define('ApprovalLimit', {
    limit: DataTypes.INTEGER
  }, {
    underscored: true,
    tableName: 'approval_limits',
  });

  ApprovalLimit.associate = function (models) {
    ApprovalLimit.Employee = ApprovalLimit.belongsTo(models.Employee);

    ApprovalLimit.CostCentre = ApprovalLimit.belongsTo(models.CostCentre);
  };

  return ApprovalLimit;
};
