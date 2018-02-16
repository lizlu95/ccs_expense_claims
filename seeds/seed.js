const app = require('../app');
const database = require('../models/index');
const manager = require('./manager');

manager.load(function () {
  process.exit();
});
