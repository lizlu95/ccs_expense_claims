const app = require('./app');
const database = require('./models/index');
const port = process.env.PORT || 3000;

const server = app.listen(port, function () {
  console.log('Listening on port ' + port + '!');
});

module.exports = server;
