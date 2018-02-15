const YAML = require('yamljs');
const _ = require('underscore');
const request = require('supertest');
const async = require('async');
const app = require('../app');
const assert = require('chai').assert;

const employeeFixtures = YAML.load('fixtures/test/Employee.yml')['fixtures'];
const employeeOne = employeeFixtures[0]['data'];
const employeeTwo = employeeFixtures[1]['data'];

const helper = {};

// @param agent     agent used to persist cookies/session
// @param callback  use with waterfall to pass any err to next callback
helper.authenticate = function (agent, callback) {
  agent
    .post('/login')
    .type('form')
    .send({
      email: employeeOne.email,
      password: employeeOne.password,
    })
    .expect(302)
    .expect('Location', '/')
    .end(function (err, res) {
      callback(err, agent);
    });
};

// @param steps  array of steps to execute that accept agent param
//               where agent can be used to make authenticated requests
// @param done   callback to call after all steps are completed
helper.withAuthenticate = function (steps, done) {
  var agent = request.agent(app);

  async.waterfall([
    function (callback) {
      helper.authenticate(agent, callback);
    },
    function(agent, callback) {
      async.eachSeries(steps, function (step, callback) {
        step(agent, callback);
      }, function(err, results) {
        if (err) {
          done(err);
        } else {
          callback(null);
        }
      });
    },
  ], function (err, result) {
    if (err) {
      done(err);
    } else {
      done();
    }
  });
};

module.exports = helper;
