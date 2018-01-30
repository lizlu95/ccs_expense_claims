const app = require('./app');
const connection = require('./database');
const port = process.env.PORT || 3000;

const server = app.listen(port, function () {
  console.log('Listening on port ' + port + '!');
});

module.exports = server;
