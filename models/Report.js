'use strict';

module.exports = (sequelize, DataTypes) => {
  var Report = sequelize.define('Report', {
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
    },
    downloadLink: {
        type: DataTypes.STRING,
        field: 'download_link',
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
    tableName: 'reports',
  });

  Report.associate = function (models) {
    Report.Employee = Report.belongsTo(models.Employee);
  };

  Report.TYPE = {
      STATS: 'statistics',
      NAV: 'nav',
      T24: 't24',
      PAYROLL: 'payroll',
  };

  return Report;
};
