const assert = require('chai').assert;
const app = require('../../app');
const request = require('supertest');
const async = require('async');
const helper = require('./../helper');
const manager = require('../../seeds/manager');
const _ = require('underscore');
const Op = require('sequelize').Op;
const YAML = require('yamljs');
const sinon = require('sinon');
const Promise = require('promise');

const s3 = require('../../s3');

const Notifier = require('../../mixins/notifier');

const models = require('../../models/index');
const ExpenseClaim = models.ExpenseClaim;
const CostCentre = models.CostCentre;

const fixturesDirectory = 'fixtures/test/';
const fixturesRootKey = 'fixtures';
const fixturesDataKey = 'data';
const employeeFixtures = YAML.load(fixturesDirectory + 'Employee.yml')[fixturesRootKey];
const employeeOne = employeeFixtures[0][fixturesDataKey];
const employeeTwo = employeeFixtures[1][fixturesDataKey];

describe('users router', function () {
  beforeEach(function (done) {
    manager.load(done);
  });

  afterEach(function (done) {
    manager.destroy(done);
  });

  it('/users/:id/signature GET retrieves self-signed key from Amazon S3', (done) => {
    var agent = request.agent(app);

    var employeeId = employeeOne.id;
    var fileName = 'filename.jpg';
    var contentType = 'image/jpeg';
    var fileKey = 'users/1/' + fileName;
    // build up expected S3 string
    var expectedUrl = '';
    _.each([
      'https://',
      s3.config.params.Bucket,
      '.s3.',
      s3.config.region,
      '.amazonaws.com/',
      fileKey,
      '?AWSAccessKeyId=',
      s3.config.accessKeyId,
      '&Content-Type=',
      encodeURIComponent(contentType),
    ], (component) => {
      expectedUrl += component;
    });

    async.waterfall([
      function (callback) {
        agent
          .get('/users/' + employeeId.toString() + '/signature')
          .expect(302)
          .expect('Location', '/login')
          .end((err, res) => {
            callback(null);
          });
      },
      function (callback) {
        helper.withAuthenticate(agent, [
          function (agent, callback) {
            // with proper params signature is fetched
            agent
              .get('/users/' + employeeId.toString() + '/signature')
              .query({
                fileName: fileName,
                contentType: contentType,
              })
              .expect(200)
              .expect('Content-Type', 'application/json; charset=utf-8')
              .end((err, res) => {
                if (err) {
                  callback(err);
                } else {
                  var signedUrl = res.body.signedUrl;
                  var signedUrlParts = signedUrl.split('&Expires');
                  assert.equal(signedUrlParts[0], expectedUrl);
                  assert.isNotNull(signedUrlParts[1]);
                  assert.isTrue(signedUrl.indexOf('Signature') !== -1);

                  callback(null);
                }
              });
          },
          function (agent, callback) {
            // with improper params 422 is returned
            var employeeId = employeeOne.id;
            async.eachSeries([
              { fileName: 'filename.jpg' },
              { contentType: 'image/jpeg' },
              {},
            ], (params, callback) => {
              agent
                .get('/users/' + employeeId.toString() + '/signature')
                .query({
                  fileName: 'filename.jpg',
                })
                .expect(422)
                .end((err, res) => {
                  callback(err);
                });
            }, (err) => {
              callback(err);
            });
          },
        ], callback, '/users/' + employeeId.toString() + '/signature');
      },
    ], (err) => {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });
});
