const config = require('./config/config')['database'][process.env.NODE_ENV];

var connection = {
  host: config.host,
  user: config.user,
  password: config.pass,
  database: config.name,
};

module.exports = {
  development: {
    client: 'mysql',
    connection: connection,
  },
  production: {
    client: 'mysql',
    connection: connection,
    pool: {
      min: 2,
      max: 10
    },
  }
};
