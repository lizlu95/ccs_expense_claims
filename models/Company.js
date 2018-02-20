'use strict';

module.exports = (sequelize, DataTypes) => {
  var Company = sequelize.define('Company', {
    name: {
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
    tableName: 'companies',
  });

  return Company;
};
