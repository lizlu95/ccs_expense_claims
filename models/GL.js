'use strict';

module.exports = (sequelize, DataTypes) => {
  var GL = sequelize.define('GL', {
    number: {
      type: DataTypes.INTEGER,
    },
    description: {
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
    tableName: 'gls',
  });

  GL.associate = function (models) {
    GL.ExpenseClaimItems = GL.hasMany(models.ExpenseClaimItem, {
      foreignKey: 'gl_id',
    });
  };

  return GL;
};
