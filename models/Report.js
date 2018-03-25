'use strict';

module.exports = (sequelize, DataTypes) => {
  // TODO: new key column

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
    tableName: 'reports',
  });

  Report.associate = function (models) {
    Report.Employee = Report.belongsTo(models.Employee);
  };

  Report.TYPE = {
      DEFAULT: 'nav',
      NAV: 'nav',
      T24: 't24',
      PAYROLL: 'payroll',
  };

  return Report;
};
