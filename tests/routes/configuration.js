const assert = require('chai').assert;
const app = require('../../app');
const request = require('supertest');
const async = require('async');
const helper = require('./../helper');
const manager = require('../../seeds/manager');
const _ = require('underscore');
const Op = require('sequelize').Op;

const models = require('../../models/index');
const Configuration = models.Configuration;
const Employee = models.Employee;

const Configuration_ROUTE = '/system/configuration';
const Configuration_Settings_ROUTE = '/system/configuration/settings';
const Configuration_Users_ROUTE = '/system/configuration/users';

describe('system configuration page', function () {
    beforeEach(function (done) {
        manager.load(done);
    });

    afterEach(function (done) {
        manager.destroy(done);
    });

    it('/system/configuration GET routes return 302', function (done) {
        request(app)
            .get(Configuration_ROUTE)
            .expect(302)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
    });

    it('/system/configuration/settings POST routes', function (done) {
        done()
    });
});
