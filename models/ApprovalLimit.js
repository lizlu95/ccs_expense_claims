'use strict';

const models = require('../models/index');

module.exports = (sequelize, DataTypes) => {
  var ApprovalLimit = sequelize.define('ApprovalLimit', {
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
    },
    costCentreId: {
      type: DataTypes.INTEGER,
      field: 'cost_centre_id',
    },
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
