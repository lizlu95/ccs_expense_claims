const app = require('../app');
const manager = require('./manager');

manager.load(function () {
  process.exit();
});
