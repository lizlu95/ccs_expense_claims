const express = require('express');
const router = express.Router();
const models = require('../models/index');
const Configuration = models.Configuration;
const Employee = models.Employee;

/* add more if want add more column of table into PUG */
const SettingKeysOnPug = ['name', 'value'];
const UserKeysOnPug = ['id', 'email', 'name', 'updated_at'];

const NAME = 'newSettingsValue';
const AdminArrName = 'admin_employee_ids';

const MAXLimit = 100;
const MINLimit = 0;

/* GET /system/configuration
   read data from database */
let settings;
let users;
let admins;
let notAdmins;
router.get('/', function (req, res, next) {
    getValues().then(function (result) {
        // console.log(result);
        res.locals.title = 'System Configuration';
        res.render('admin/sysConfig',
            {
                settingsPug: settings,
                newSettingValuePug: NAME,
                usersPug: users,
                adminsPug: admins,
                notAdminsPug: notAdmins
            }
        )
    }).catch(function (error) {
        // console.log(error);
        res.render('error')
    })
});

getValues = function () {

    getValue = function (configuration, arr) {

        isBelongArr2 = function (arr1, arr2) {
            let boolean = true;
            for (let x of arr1) {
                if (!arr2.includes(x)) {
                    boolean = false;
                }
            }
            return boolean;
        };

        let result = {};
        for (let x of arr) {
            if (isBelongArr2(arr, SettingKeysOnPug)) {
                result[x] = configuration.dataValues.json[x]
            } else if (isBelongArr2(arr, UserKeysOnPug)) {
                result[x] = configuration.dataValues[x]
            }
        }
        return result;
    };

    isAdminArr = function (configuration) {
        return configuration.dataValues.json.name === AdminArrName
    };

    return new Promise(function (fulfill, reject) {
        settings = [];
        users = [];
        admins = [];
        notAdmins = [];
        Configuration.findAll().then(function (configurations) {
            for (let configuration of configurations) {
                if (!isAdminArr(configuration)) {
                    settings.push(getValue(configuration, SettingKeysOnPug))
                } else {
                    Employee.findAll().then(function (employees) {
                        for (let employee of employees) {
                            let user = getValue(employee, UserKeysOnPug);
                            let adminArr = JSON.parse(configuration.dataValues.json.value);
                            let isAdmin = adminArr.includes(user.id);
                            user.isAdmin = isAdmin;
                            users.push(user);
                            if (isAdmin) {
                                admins.push(user)
                            } else {
                                notAdmins.push(user)
                            }
                        }
                        fulfill({
                            settings: settings,
                            users: users,
                            admins: admins,
                            notAdmins: notAdmins
                        })
                    })
                }
            }
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
    } else if (value >= MINLimit && value <= MAXLimit) {
        /*  one change request and input is valid
            Configurations.update return a promise */
        promise = Configuration.update({
            json: {
                name: name,
                value: value
            }
        }, {
            where: {
                json: {
                    name: name
                }
            }
        })
    } else {
        /* one change request but input is invalid because over limit */
        promise = new Promise(function (fulfill, reject) {
            reject(name + ': ' + value + ' is invalid [' + MINLimit + '<=' + name + '<=' + MAXLimit + ']')
        })
    }
    return promise
};

module.exports = router;
