const Sequelize = require('sequelize');
const config = require('./config/config')['database'][process.env.NODE_ENV];

const connection = new Sequelize(
  config.name,
  config.user,
  config.pass,
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
  connection.close();
});

module.exports = connection;
