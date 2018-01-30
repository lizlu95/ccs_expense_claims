const config = {};

config.database = {
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
  development: {
    host: process.env.ECA_DATABASE_HOST_PRODUCTION || 'localhost',
    username: process.env.ECA_DATABASE_USERNAME_PRODUCTION || 'username',
    password: process.env.ECA_DATABASE_PASSWORD_PRODUCTION || 'password',
    database: process.env.ECA_DATABASE_NAME_PRODUCTION || 'database_prod',
    dialect: 'mysql',
  },
}

module.exports = config;
