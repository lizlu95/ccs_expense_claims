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
    models.ApprovalLimit.belongsTo(models.Employee);

    models.ApprovalLimit.belongsTo(models.CostCentre);
  };

  return ApprovalLimit;
};
