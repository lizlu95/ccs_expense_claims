const express = require('express');
const router = express.Router();
const database = require('../models/index');
const Configuration = database.Configuration;
const Employee = database.Employee;

/* add more if want add more column of table into PUG */
const Setting_Keys_Pug = ['name', 'value'];
const User_Keys_Pug = ['id', 'email', 'name'];

const NEW_SETTING_VALUE_NAME_JS = 'newSettingsValue';
const Admin_Arr_Name_MYSQL = 'admin_employee_ids';

let settings, users, selectedIDs, adminArr, selectedUsers;

/* GET /system/configuration
   read data from database */
router.get('/', function (req, res, next) {
    getValues().then(function (result) {
        res.locals.title = 'System Configuration';
        res.render('admin/sysConfig',
            {
                settingsPug: result.settings,
                newSettingValuePug: NEW_SETTING_VALUE_NAME_JS,
                usersPug: result.selectedUsers,
                // maxPug: MAX_LIMIT,
                // minPug: MIN_LIMIT
            }
        );
    }).catch(function (error) {
        next(error)
    })
});

getValues = function () {
    return new Promise(function (fulfill, reject) {
        if (typeof selectedIDs === 'undefined') {
            Configuration.findAll().then(function (configurations) {
                settings = [];
                for (let configuration of configurations) {
                    if (!isAdminArr(configuration)) {
                        settings.push(getValue(configuration, Setting_Keys_Pug))
                    } else {
                        Employee.findAll().then(function (employees) {
                            users = [];
                            selectedIDs = [];
                            adminArr = JSON.parse(configuration.dataValues.value);
                            for (let employee of employees) {
                                let user = getValue(employee, User_Keys_Pug);
                                let id = user.id;
                                user.isAdmin = adminArr.includes(id);
                                users.push(user);
                                selectedIDs.push(id);
                            }
                            fulfill({
                                settings: settings,
                                selectedUsers: users
                            })
                        }).catch(function (error) {
                            reject(error)
                        })
                    }
                }
            }).catch(function (error) {
                reject(error)
            })
        } else {
            selectedUsers = [];
            for (let x of users) {
                if (selectedIDs.includes(x.id)) {
                    selectedUsers.push(x);
                }
            }
            fulfill({
                settings: settings,
                selectedUsers: selectedUsers
            })
        }
    })
};

getValue = function (data, arr) {
    let result = {};
    for (let x of arr) {
        result[x] = data.dataValues[x]
    }
    return result
};

isAdminArr = function (configuration) {
    return configuration.dataValues.name === Admin_Arr_Name_MYSQL
};

/* POST /system/configuration/settings
   update database */
router.post('/settings', function (req, res, next) {
    updateSettings(req).then(function () {
        res.redirect('/system/configuration')
    }).catch(function (error) {
        next(error)
    })
});

/* updateValue() return a promise, should wrap in Promise.all */
updateSettings = function (req) {
    return new Promise(function (fulfill, reject) {
        let pArr = [];
        let newValue = req.body[NEW_SETTING_VALUE_NAME_JS];
        let kArr = Object.keys(req.body);
        let index = kArr.indexOf(NEW_SETTING_VALUE_NAME_JS);
        if (index !== -1) {
            kArr.splice(index, 1);
        }
        for (let x in kArr) {
            pArr.push(updateSetting(x, kArr[x], newValue[x]));
        }
        Promise.all(pArr).then(function () {
            fulfill();
        }).catch(function (error) {
            reject(error)
        })
    })
};

/* update value for one system configuration */
updateSetting = function (index, name, value) {
    let promise;
    if (value === '') {
        /* no change request for these configuration */
        promise = new Promise(function (fulfill) {
            fulfill(name + ' does not change')
        })
    } else {
        /*  one change request
            Configurations.update return a promise */
        promise = Configuration.update({
            name: name,
            value: value
        }, {
            where: {
                name: name
            }
        })
    }
    promise.then(function (result) {
        if (typeof result === 'object') {
            settings[index].value = value;
        }
    });
    return promise
};

/* POST /system/configuration/settings
   update database */
router.post('/users', function (req, res, next) {
    updateUser(req).then(function () {
        res.redirect('/system/configuration')
    }).catch(function (error) {
        next(error)
    })
});

updateUser = function (req) {
    let promise;
    let body = req.body;
    let bodyArr = Object.keys(body);
    if (bodyArr.includes('all')) {
        selectedIDs = [];
        for (let x of users) {
            selectedIDs.push(x.id)
        }
        promise = new Promise(function (fulfill) {
            fulfill('All')
        })
    } else if (bodyArr.includes('admin')) {
        selectedIDs = [];
        for (let x of adminArr) {
            selectedIDs.push(x)
        }
        promise = new Promise(function (fulfill) {
            fulfill('Admin')
        })
    } else if (bodyArr.includes('notAdmin')) {
        selectedIDs = [];
        for (let x of users) {
            let id = x.id;
            if (!adminArr.includes(id)) {
                selectedIDs.push(id)
            }
        }
        promise = new Promise(function (fulfill) {
            fulfill('Not Admin')
        })
    } else if (bodyArr.includes('move')) {
        let numAdmin = 0;
        let numNotAdmin = 0;
        let moveArr = [];
        let notMoveArr = [];
        for (let x of bodyArr) {
            if (body[x] === 'on') {
                let index = Number(x);
                if (adminArr.includes(index)) {
                    moveArr.push(index);
                    numAdmin++
                } else {
                    notMoveArr.push(index);
                    numNotAdmin++
                }
            }
        }
        if (numNotAdmin === 0 && numAdmin > 0) {
            for (let x of moveArr) {
                let index = adminArr.indexOf(x);
                if (index !== -1) {
                    adminArr.splice(index, 1);
                }
            }
            let adminArrStr = '[' + adminArr.toString() + ']';
            promise = Configuration.update({
                name: Admin_Arr_Name_MYSQL,
                value: adminArrStr
            }, {
                where: {
                    name: Admin_Arr_Name_MYSQL
                }
            })
        } else {
            promise = new Promise(function (fulfill) {
                fulfill('Move: ' + notMoveArr.toString()  + ' is Not Admin already')
            })
        }
    } else if (bodyArr.includes('add')) {
        let numAdmin = 0;
        let numNotAdmin = 0;
        let addArr = [];
        let notAddArr = [];
        for (let x of bodyArr) {
            if (body[x] === 'on') {
                let index = Number(x);
                if (!adminArr.includes(index)) {
                    addArr.push(index);
                    numNotAdmin++
                } else {
                    notAddArr.push(index);
                    numAdmin++
                }
            }
        }
        if (numNotAdmin > 0 && numAdmin === 0) {
            for (let x of addArr) {
                adminArr.push(x);
            }
            let adminArrStr = '[' + adminArr.toString() + ']';
            promise = Configuration.update({
                name: Admin_Arr_Name_MYSQL,
                value: adminArrStr
            }, {
                where: {
                    name: Admin_Arr_Name_MYSQL
                }
            })
        } else {
            promise = new Promise(function (fulfill) {
                fulfill('Add: ' + notAddArr.toString() + ' is Admin already')
            })
        }
    } else if (bodyArr.includes('find')) {
        try {
            let idArr = JSON.parse('[' + body.filter + ']');
            selectedIDs = [];
            for (let x of users) {
                let id = x.id;
                if (idArr.includes(id)) {
                    selectedIDs.push(id)
                }
            }
            promise = new Promise(function (fulfill) {
                fulfill('Find: ' + idArr.toString())
            })
        } catch (error) {
            promise = new Promise(function (fulfill) {
                fulfill('Find: ' + body.filter + 'is not valid')
            })
        }
    }
    promise.then(function (result) {
        if (typeof result === 'object') {
            // mean the database is update, so users need update
            for (let x of users) {
                x.isAdmin = adminArr.includes(x.id)
            }
        }
    });
    return promise
};

module.exports = router;
