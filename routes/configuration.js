const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const models = require('../models/index');
const Configuration = models.Configuration;
/* add more if want add more column of table into PUG */
const SettingKeysOnPug = ['name', 'value'];

const NAME = 'newSettingsValue';

/* INT(11) = -2147483648_2147483647 */
const MAXOnDataBase = 2147483647;
const MINLimit = 0;

/* GET /system/configuration
   read data from database */
let settings;

router.get('/', function (req, res, next) {
    getValues().then(function (result) {
        // console.log(result);
        res.locals.title = 'System Configuration';
        res.render('admin/sysConfig',
            {
                settingsPug: settings,
                newSettingValuePug: NAME
            }
        )
    }).catch(function (error) {
        // console.log(error);
        res.render('error')
    })
});

getValues = function () {
    getValue = function (item, arr) {
        let result = {};
        for (let x of arr) {
            result[x] = item.dataValues[x];
        }
        return result;
    };

    return new Promise(function (fulfill, reject) {
        settings = [];
        Configuration.findAll().then(function (result) {
            for (let item of result) {
                settings.push(getValue(item, SettingKeysOnPug))
            }
            fulfill({
                settings: settings
            });
        }).catch(function (error) {
            reject(error)
        })
    })
};

/* POST /system/configuration/settings
   update database */
router.post('/settings', function (req, res, next) {
    updateSettings(req).then(function (result) {
        // console.log(result);
        res.redirect('/system/configuration')
    }).catch(function (error) {
        // console.log(error);
        res.redirect('/system/configuration')
    })
});

/* updateValue() return a promise, should wrap in Promise.all */
updateSettings = function (req) {
    return new Promise(function (fulfill, reject) {
        let pArr = [];
        let newValue = req.body[NAME];
        /* kArr = ['max_per_diem_amount', 'newSettingsValue', 'KM_rates_less_than_5000', 'KM_rates_great_than_5000', 'per_mileage_value', 'max_per_meal_amount'] */
        let kArr = Object.keys(req.body);
        let index = kArr.indexOf(NAME);    // <-- Not supported in <IE9
        if (index !== -1) {
            kArr.splice(index, 1);
        }
        /* kArr = ['max_per_diem_amount', 'KM_rates_less_than_5000', 'KM_rates_great_than_5000', 'per_mileage_value', 'max_per_meal_amount'] */
        for (let x in kArr) {
            pArr.push(updateSetting(kArr[x], newValue[x]));
        }
        Promise.all(pArr).then(function (result) {
            fulfill(result)
        }).catch(function (error) {
            reject(error)
        })
    })
};

/* update value for one system configuration */
updateSetting = function (name, value) {
    let promise;
    if (value === '') {
        // no change request for these configuration
        promise = new Promise(function (fulfill, reject) {
            fulfill(name + ' does not change')
        })
    } else if (value >= MINLimit && value <= MAXOnDataBase) {
        /*  one change request and input is valid
            Configurations.update return a promise */
        promise = Configuration.update({
            value: value
        }, {
            where: {
                name: name
            }
        })
    } else {
        /* one change request but input is invalid because over limit */
        promise = new Promise(function (fulfill, reject) {
            reject(name + ': ' + value + ' is invalid [' + MINLimit + '<=' + name + '<=' + MAXOnDataBase + ']')
        })
    }
    return promise
};

module.exports = router;
