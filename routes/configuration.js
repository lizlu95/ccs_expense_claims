const express = require('express');
const router = express.Router();
const models = require('../models/index');
const Configuration = models.Configuration;
const Employee = models.Employee;
const _ = require('underscore');
const async = require('async');
const Op = require('sequelize').Op;

const NEW_SETTING_VALUE_NAME_JS = 'newSettingsValue';
const Admin_Arr_Name_MYSQL = 'admin_employee_ids';

let selectedIDs;
/* GET /system/configuration
   read data from database */
router.get('/', (req, res, next) => {
    let admins;
    async.waterfall([
        (callback) => {
            res.locals.title = 'System Configuration';
            res.locals.newSettingValuePug = NEW_SETTING_VALUE_NAME_JS;
            callback(null);
        },
        (callback) => {
            Configuration.findAll().then((configurations) => {
                let settings = [];
                for (let x of configurations) {
                    if (x.name === Admin_Arr_Name_MYSQL) {
                        admins = JSON.parse(x.value);
                    } else {
                        settings.push(x);
                    }
                }
                res.locals.settingsPug = _.map(settings, (configuration) => {
                    return {
                        name: configuration.name,
                        value: configuration.value
                    };
                });
                callback(null);
            });
        },
        (callback) => {
            if (typeof selectedIDs === 'undefined') {
                // first time load page
                Employee.findAll().then((users) => {
                    res.locals.usersPug = _.map(users, (user) => {
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            isAdmin: admins.includes(user.id)
                        };
                    });
                    callback(null);
                });
            } else {
                Employee.findAll({
                    where: {
                        id: {
                            [Op.in]: selectedIDs,
                        },
                    },
                }).then((users) => {
                    res.locals.usersPug = _.map(users, (user) => {
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            isAdmin: admins.includes(user.id)
                        };
                    });
                    callback(null);
                });
            }
        }
    ], (err) => {
        if (err) {
            next(err);
        } else {
            res.render('admin/sysConfig');
        }
    });
});
/* POST /system/configuration/settings
   update database */
router.post('/settings', (req, res, next) => {
    let pArr = [];
    let newValue = req.body[NEW_SETTING_VALUE_NAME_JS];
    let kArr = Object.keys(req.body);
    let index = kArr.indexOf(NEW_SETTING_VALUE_NAME_JS);
    if (index !== -1) {
        kArr.splice(index, 1);
    }
    for (let x in kArr) {
        pArr.push(updateSetting(kArr[x], newValue[x]));
    }
    Promise.all(pArr).then((results) => {
        let hasNoInput = true;
        for (let x of results) {
            if (typeof x === 'object') {
                hasNoInput = false;
                req.flash(x.flashType, x.message)
            }
        }
        if (hasNoInput) {
            req.flash('error', 'No setting value is changed');
        }
        Promise.all(pArr).then(() => {
            res.redirect('/system/configuration')
        }).catch((error) => {
            next(error)
        })
    });
});

/* update value for one system configuration */
updateSetting = (name, value) => {
    return new Promise((fulfill, reject) => {
        if (value === '') {
            /* no change request for these configuration */
            fulfill(name + ' does not change')
        } else {
            /*  one change request
                Configurations.update return a promise */
            Configuration.findOne({
                where: {
                    name: name
                }
            }).then((result) => {
                let oldValue = result.value;
                if (oldValue !== value) {
                    result.value = value;
                    result.save().then(() => {
                        fulfill({
                            flashType: 'success',
                            message: name + ': ' + oldValue + '->' + value
                        });
                    });
                } else {
                    fulfill({
                        flashType: 'error',
                        message: name + ' is ' + value + ' already'
                    });
                }
            })
        }
    })
};

/* POST /system/configuration/settings
   update database */
router.post('/users', (req, res, next) => {
    let body = req.body;
    let bodyArr = Object.keys(body);
    if (bodyArr.includes('all')) {
        Employee.findAll().then((users) => {
            selectedIDs = [];
            for (let x of users) {
                selectedIDs.push(x.id);
            }
            req.flash('success', 'All employees selected');
            res.redirect('/system/configuration')
        }).catch((error) => {
            next(error);
        })
    } else if (bodyArr.includes('admin')) {
        Configuration.findOne({
            where: {
                name: {
                    [Op.eq]: Admin_Arr_Name_MYSQL,
                },
            },
        }).then((configuration) => {
            selectedIDs = JSON.parse(configuration.value);
            req.flash('success', 'Only admin type Employees selected');
            res.redirect('/system/configuration')
        }).catch((error) => {
            next(error);
        })
    } else if (bodyArr.includes('notAdmin')) {
        let notSelected;
        async.waterfall([
            (callback) => {
                Configuration.findOne({
                    where: {
                        name: {
                            [Op.eq]: Admin_Arr_Name_MYSQL,
                        },
                    },
                }).then((configuration) => {
                    notSelected = JSON.parse(configuration.value);
                    callback(null);
                })
            },
            (callback) => {
                Employee.findAll().then((users) => {
                    selectedIDs = [];
                    for (let x of users) {
                        if (!notSelected.includes(x.id)) {
                            selectedIDs.push(x.id);
                        }
                    }
                    callback(null);
                });
            }
        ], (err) => {
            if (err) {
                next(err);
            } else {
                req.flash('success', 'Only normal user type Employees selected');
                res.redirect('/system/configuration')
            }
        });
    } else if (bodyArr.includes('move')) {
        let admins;
        let numAdmin = 0;
        let numNotAdmin = 0;
        let moveArr = [];
        let notMoveArr = [];
        async.waterfall([
            (callback) => {
                Configuration.findOne({
                    where: {
                        name: {
                            [Op.eq]: Admin_Arr_Name_MYSQL,
                        },
                    },
                }).then((configuration) => {
                    admins = JSON.parse(configuration.value);
                    callback(null);
                })
            },
            (callback) => {
                for (let x of bodyArr) {
                    if (body[x] === 'on') {
                        let index = Number(x);
                        if (admins.includes(index)) {
                            moveArr.push(index);
                            numAdmin++
                        } else {
                            notMoveArr.push(index);
                            numNotAdmin++
                        }
                    }
                }
                if (moveArr.includes(req.user.id)) {
                    req.flash('error', 'Your are Employee' + req.user.id + ', you cannot demote yourself');
                    callback(null)
                } else if (numNotAdmin === 0 && numAdmin > 0) {
                    for (let x of moveArr) {
                        let index = admins.indexOf(x);
                        if (index !== -1) {
                            admins.splice(index, 1);
                        }
                    }
                    let adminsStr = '[' + admins.toString() + ']';
                    Configuration.update({
                        name: Admin_Arr_Name_MYSQL,
                        value: adminsStr
                    }, {
                        where: {
                            name: Admin_Arr_Name_MYSQL
                        }
                    }).then(function () {
                        req.flash('success', 'Employee ' + moveArr + ' changed to normal user');
                        callback(null)
                    })
                } else if (!(numAdmin + numNotAdmin)) {
                    req.flash('error', 'No employee selected to demote');
                    callback(null)
                } else {
                    req.flash('error', 'Employee ' + notMoveArr + ' is normal user already');
                    callback(null)
                }
            }
        ], (err) => {
            if (err) {
                next(err);
            } else {
                res.redirect('/system/configuration')
            }
        });
    } else if (bodyArr.includes('add')) {
        let admins;
        let numAdmin = 0;
        let numNotAdmin = 0;
        let addArr = [];
        let notAddArr = [];
        async.waterfall([
            (callback) => {
                Configuration.findOne({
                    where: {
                        name: {
                            [Op.eq]: Admin_Arr_Name_MYSQL,
                        },
                    },
                }).then((configuration) => {
                    admins = JSON.parse(configuration.value);
                    callback(null);
                })
            },
            (callback) => {
                for (let x of bodyArr) {
                    if (body[x] === 'on') {
                        let index = Number(x);
                        if (!admins.includes(index)) {
                            addArr.push(index);
                            numNotAdmin++
                        } else {
                            notAddArr.push(index);
                            numAdmin++
                        }
                    }
                }
                if (notAddArr.includes(req.user.id)) {
                    req.flash('error', 'Your are Employee' + req.user.id + ', you cannot promote yourself');
                    callback(null)
                } else if (numNotAdmin > 0 && numAdmin === 0) {
                    for (let x of addArr) {
                        admins.push(x);
                    }
                    let adminsStr = '[' + admins.toString() + ']';
                    Configuration.update({
                        name: Admin_Arr_Name_MYSQL,
                        value: adminsStr
                    }, {
                        where: {
                            name: Admin_Arr_Name_MYSQL
                        }
                    }).then(() => {
                        req.flash('success', 'Employee ' + addArr + ' changed to admin');
                        callback(null)
                    })
                } else if (!(numAdmin + numNotAdmin)) {
                    req.flash('error', 'No employee selected to promote');
                    callback(null)
                } else {
                    req.flash('error', 'Employee ' + notAddArr + ' is admin already');
                    callback(null)
                }
            }
        ], (err) => {
            if (err) {
                next(err);
            } else {
                res.redirect('/system/configuration')
            }
        });
    } else if (bodyArr.includes('find')) {
        try {
            let idArr = JSON.parse('[' + body.filter + ']');
            Employee.findAll().then((users) => {
                let usersID = [];
                let notUsersID;
                for (let x of users) {
                    usersID.push(x.id);
                }
                let isContain;
                for (let x of idArr) {
                    isContain = usersID.includes(x);
                    if (!isContain) {
                        notUsersID = x;
                        break;
                    }
                }
                if (isContain) {
                    selectedIDs = idArr;
                    req.flash('success', 'successfully find Employee' + idArr);
                    res.redirect('/system/configuration')
                } else {
                    if (typeof notUsersID === 'undefined') {
                        req.flash('error', 'No employee ID is inputted');
                    } else {
                        req.flash('error', 'Employee ' + notUsersID + ' is not on employee list');
                    }
                    res.redirect('/system/configuration')
                }
            }).catch((error) => {
                next(error);
            })
        } catch (error) {
            req.flash('error', body.filter + ' is not valid employee ID');
            res.redirect('/system/configuration')
        }
    }
});

module.exports = router;