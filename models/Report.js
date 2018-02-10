'use strict';
module.exports = (sequelize, DataTypes) => {
  var Report = sequelize.define('Report', {
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
    },
    type: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  }, {
    underscored: true,
  });

  Report.associate = function (models) {
    Report.Employee = Report.belongsTo(models.Employee);
  };

  return Report;
};
