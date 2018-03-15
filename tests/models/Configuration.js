const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const app = require('../../app');
const request = require('supertest');
const manager = require('../../seeds/manager');

const models = require('../../models/index');
const Configuration = models.Configuration;
const Employee = models.Employee;

const Admin_Arr_Name_MYSQL = 'admin_employee_ids';

describe('configuration tests', function () {
    beforeEach(function (done) {
        manager.load(done);
    });

    afterEach(function (done) {
        manager.destroy(done);
    });

    it('configuration', function (done) {
        Configuration.findAll().then(function (result) {
            assert.isNotNull(result);
            for (let x of result) {
                let name = x.dataValues.name, value = JSON.parse(x.dataValues.value);
                assert.isString(name);
                if (name !== Admin_Arr_Name_MYSQL) {
                    assert.isNumber(value)
                } else {
                    assert.isArray(value)
                }
            }
            done();
        });
    });
});
