const config = {};

config.database = {
  test: {
    host: process.env.ECA_DATABASE_HOST_TEST || 'localhost',
    user: process.env.ECA_DATABASE_USER_TEST || 'username',
    pass: process.env.ECA_DATABASE_PASS_TEST || 'password',
    name: process.env.ECA_DATABASE_NAME_TEST || '',
  },
  development: {
    host: process.env.ECA_DATABASE_HOST_DEVELOPMENT || 'localhost',
    user: process.env.ECA_DATABASE_USER_DEVELOPMENT || 'username',
    pass: process.env.ECA_DATABASE_PASS_DEVELOPMENT || 'password',
    name: process.env.ECA_DATABASE_NAME_DEVELOPMENT || '',
  },
  production: {
    host: process.env.ECA_DATABASE_HOST_PRODUCTION || 'localhost',
    user: process.env.ECA_DATABASE_USER_PRODUCTION || 'username',
    pass: process.env.ECA_DATABASE_PASS_PRODUCTION || 'password',
    name: process.env.ECA_DATABASE_NAME_PRODUCTION || '',
  }
};

module.exports = config;
