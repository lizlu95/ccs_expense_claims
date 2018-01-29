const connection = require('../database');
const sequelizeFixtures = require('sequelize-fixtures');
const models = require('../models/index');
const _ = require('underscore');

const load = function (done) {
  sanityCheck();

  sequelizeFixtures.loadFile('fixtures/*.yml', models).then(function () {
    if (done) {
      done();
    }

    console.log('Fixtures loaded!');
  });
};

const destroy = function (done) {
  sanityCheck();

  _.each(Object.values(connection.models), function (model) {
    model.destroy({ truncate: true });
  });

  if (done) {
    done();
  }

  console.log('Fixtures destroyed!');
};

function sanityCheck() {
  if (process.env.NODE_ENV != 'test') {
    console.log('Please only run test suites with NODE_ENV=test to preserve database!');

    process.exit();
  }
}

module.exports = {
  load: load,
  destroy: destroy
};
