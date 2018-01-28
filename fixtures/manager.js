const connection = require('../database');
const sequelizeFixtures = require('sequelize-fixtures');
const models = require('../models/index');
const _ = require('underscore');

const load = function (done) {
  sequelizeFixtures.loadFile('fixtures/*.yml', models).then(function () {
    if (done) {
      done();
    }

    console.log('Fixtures loaded!');
  });
};

const destroy = function (done) {
  _.each(Object.values(connection.models), function (model) {
    model.destroy({ truncate: true });
  });

  if (done) {
    done();
  }

  console.log('Fixtures destroyed!');
};

module.exports = {
  load: load,
  destroy: destroy
};
