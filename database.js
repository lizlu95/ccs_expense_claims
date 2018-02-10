const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')['database'][env];

const database = new Sequelize(
  config.name,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    logging: false,
  }
);

process.on('exit', function () {
  // TODO possibly check for a better graceful exit
  database.close();
});

module.exports = database;
