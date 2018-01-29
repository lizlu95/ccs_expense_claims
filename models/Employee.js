const Sequelize = require('sequelize');
const connection = require('../database');

const Employee = connection.define('employee', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: Sequelize.INTEGER,
    field: 'employee_id',
  },
  email: Sequelize.STRING,
  password: Sequelize.STRING,
  name: Sequelize.STRING,
  managerId: {
    type: Sequelize.INTEGER,
    field: 'manager_id',
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    field: 'is_admin',
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
  },
}, {
  timestamps: false,
  underscored: true,
});

Employee.belongsTo(Employee, {
  foreignKey: 'manager_id',
  as: 'manager',
});

module.exports = Employee;
