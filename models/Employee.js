'use strict';

module.exports = (sequelize, DataTypes) => {
  var Employee = sequelize.define('Employee', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
    },
    managerId: {
      type: DataTypes.INTEGER,
      field: 'manager_id',
    },
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    isAdmin: {
      type: DataTypes.BOOLEAN,
      field: 'is_admin',
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
    tableName: 'employees',
  });

  Employee.associate = function (models) {
    models.Employee.belongsTo(models.Employee, {
      foreign_key: 'manager_id',
      as: 'manager',
    });

    models.Employee.hasMany(models.Employee, {
      foreign_key: 'manager_id',
      as: 'managee',
    });

    models.Employee.belongsToMany(models.ExpenseClaim, {
      through: 'employees_expense_claims',
      foreign_key: 'employee_id',
    });
  };

  return Employee;
};
