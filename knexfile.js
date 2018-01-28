var connection = {
  host: process.env.ECA_DATABASE_HOST || 'localhost',
  user: process.env.ECA_DATABASE_USER || 'username',
  password: process.env.ECA_DATABASE_PASS || 'password',
  database: process.env.ECA_DATABASE_NAME || '',
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
