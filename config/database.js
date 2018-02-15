'use strict';

module.exports = {
  test: {
    host: process.env.ECA_DATABASE_HOST_TEST || 'localhost',
    username: process.env.ECA_DATABASE_USERNAME_TEST || 'username',
    password: process.env.ECA_DATABASE_PASSWORD_TEST || 'password',
    database: process.env.ECA_DATABASE_NAME_TEST || 'database_test',
    dialect: 'mysql',
  },
  development: {
    host: process.env.ECA_DATABASE_HOST_DEVELOPMENT || 'localhost',
    username: process.env.ECA_DATABASE_USERNAME_DEVELOPMENT || 'username',
    password: process.env.ECA_DATABASE_PASSWORD_DEVELOPMENT || 'password',
    database: process.env.ECA_DATABASE_NAME_DEVELOPMENT || 'database_development',
    dialect: 'mysql',
  },
  production: {
    host: 'us-cdbr-iron-east-05.cleardb.net',
    username: 'bf377c32f0e3c3',
    password: 'e2e5a002',
    database: 'heroku_e0ab878773516e7',
    dialect: 'mysql',
  },
};
