const YAML = require('yamljs');

const employeeFixtures = YAML.load('fixtures/Employee.yml');
const employeeOne = employeeFixtures['fixtures'][0]['data'];

const helper = {};

// @param agent  agent used to persist cookies/session
// @param done   use with waterfall to pass any err to next callback
helper.authenticate = function (agent, done) {
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
      // pass any error to callback
      done(null, err);
    });
};

module.exports = helper;
