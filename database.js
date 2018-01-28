const Sequelize = require('sequelize');

const connection = new Sequelize(
  process.env.ECA_DATABASE_NAME || '',
  process.env.ECA_DATABASE_USER || 'username',
  process.env.ECA_DATABASE_PASS || 'password',
  {
    host: process.env.ECA_DATABASE_HOST || 'localhost',
    dialect: 'mysql',

    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
  }
);

module.exports = connection;
