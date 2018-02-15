const Sequelize = require('sequelize');
const sequelizeFixtures = require('sequelize-fixtures');
const database = require('../models/index');
const _ = require('underscore');
const async = require('async');

const env = process.env.NODE_ENV || 'development';

const load = function (done) {
  async.waterfall([
    function (callback) {
      var fixturesPath = 'fixtures/' + env + '/*.yml';
      sequelizeFixtures.loadFile(fixturesPath, database, {
        log: function () {},
      }).then(function () {
        callback(null);
      });
    },
  ], function (err) {
    if (err) {
      console.log(err);

      process.exit();
    } else {
      if (done) {
        done();
      }
    }
  });
};

const destroy = function (done) {
  async.waterfall([
    function (callback) {
      eachModel((model, callback) => {
        model.destroy({
          truncate: true,
        }).then(() => {
          callback(null);
        });
      }, callback);
    },
  ], function (err) {
    if (err) {
      console.log(err);

      process.exit();
    } else {
      if (done) {
        done();
      }
    }
  });
};

function eachModel(fn, callback) {
  async.eachSeries(database.models, (model, callback) => {
    if (!(model instanceof Sequelize) && model !== Sequelize) {
      fn(model, callback);
    } else {
      callback(null);
    }
  }, function (err) {
    callback(err);
  });
}

module.exports = {
  load: load,
  destroy: destroy,
};
