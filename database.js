const Sequelize = require('sequelize');
const config = require('./config/config')['database'][process.env.NODE_ENV];

const connection = new Sequelize(
  config.name,
  config.user,
  config.pass,
  {
    host: process.env.ECA_DATABASE_HOST || 'localhost',
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    logging: false,
  }
);

module.exports = connection;
