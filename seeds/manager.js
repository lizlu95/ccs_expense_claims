const Sequelize = require('sequelize');
const sequelizeFixtures = require('sequelize-fixtures');
const models = require('../models/index');
const _ = require('underscore');

const env = process.env.NODE_ENV || 'development';

const load = function (done) {
  verifyEnvironment();

  var fixturesPath = 'fixtures/' + env + '/*.yml';
  sequelizeFixtures.loadFile(fixturesPath, models, {
      log: function () {},
    }).then(function () {
      if (done) {
        done();
      }
  });
};

const destroy = function (done) {
  verifyEnvironment();

  _.each(models, function (model) {
    if (!(model instanceof Sequelize) && model !== Sequelize) {
      model.destroy({
        truncate: true,
      });
    }
  });

  if (done) {
    done();
  }
};

function verifyEnvironment() {
  if (env === 'production') {
    // only seed production data to a fresh database
    if (true) {
      process.exit();
    }
  } else {
    // test and development environment can re-seed data
  }
}

module.exports = {
  load: load,
  destroy: destroy,
};
