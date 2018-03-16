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
    Promise.all(pArr).then(() => {
        res.redirect('/system/configuration')
    }).catch((error) => {
        next(error)
    })
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
            Configuration.update({
                name: name,
                value: value
            }, {
                where: {
                    name: name
                }
            }).then(() => {
                fulfill(name + ': ' + value)
            }).catch((error) => {
                reject(error);
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
                if (numNotAdmin === 0 && numAdmin > 0) {
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
                        callback(null)
                    })
                } else {
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
                if (numNotAdmin > 0 && numAdmin === 0) {
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
                    }).then(function () {
                        callback(null)
                    })
                } else {
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
        let idArr;
        try {
            idArr = JSON.parse('[' + body.filter + ']');
        } catch (error) {
            res.redirect('/system/configuration')
        } finally {
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
                    res.redirect('/system/configuration')
                } else {
                    res.redirect('/system/configuration')
                }
            }).catch((error) => {
                next(error);
            })
        }
    }
});

module.exports = router;
