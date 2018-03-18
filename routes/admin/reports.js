const async = require('async');
const express = require('express');
const router = express.Router();

const models = require('../../models/index');
const Report = models.Report;
const ExpenseClaim = models.ExpenseClaim;

/* GET /reports */
router.get('', function (req, res, next) {
    res.locals.title = 'Reports';

    res.render('admin/reportIndex');
});
router.get('/statistics', function (req, res, next) {
    res.locals.title = 'Statistics Report';

    res.render('admin/statReport');
});
router.get('/NAV', function (req, res, next) {
    res.locals.title = 'NAV Report';

    res.render('admin/NAVReport');
});

router.post('/statistic', function (req, res, next) {
    helper(req).then(function () {
        res.redirect('/reports/statistics')
    }).catch(function (error) {
        next(error)
    })
});
router.post('/NAV', function (req, res, next) {
    helper(req).then(function () {
        res.redirect('/reports/NAV')
    }).catch(function (error) {
        next(error)
    })
});
helper = function (req) {
    return new Promise(function (fulfill, reject) {
        // console.log(req.body);
        let pArr = [];
        let body = req.body;
        let bodyArr = Object.keys(body);
        for (let x of bodyArr) {
            // console.log(body[x])
        }
        if (bodyArr.includes('allsub')) {
            // console.log('All Submitters');
            pArr.push(new Promise(function (fulfill) {
                fulfill('All Submitters')
            }))
        }
        if (bodyArr.includes('allapp')) {
            // console.log('All Approvers');
            pArr.push(new Promise(function (fulfill) {
                fulfill('All Approvers')
            }))
        }
        if (bodyArr.includes('allcc')) {
            // console.log('All Cost Centres');
            pArr.push(new Promise(function (fulfill) {
                fulfill('All Cost Centres')
            }))
        }
        if (bodyArr.includes('alld')) {
            // console.log('All Date');
            pArr.push(new Promise(function (fulfill) {
                fulfill('All Date')
            }))
        }

        Promise.all(pArr).then(function (results) {
            fulfill()
        }).catch(function (error) {
            reject(error)
        })
    })
};

module.exports = router;
