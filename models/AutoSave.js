'use strict';

const models = require('../models/index');

module.exports = (sequelize, DataTypes) => {
  var AutoSave = sequelize.define('AutoSave', {
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
    },
    data: {
      type: DataTypes.TEXT,
      field: 'data',
    },
  }, {
    underscored: true,
    tableName: 'auto_saves',
  });

  AutoSave.associate = function (models) {
    AutoSave.Employee = AutoSave.belongsTo(models.Employee);
  };

  return AutoSave;
};
