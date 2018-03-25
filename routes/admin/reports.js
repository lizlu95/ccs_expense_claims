const json2csv = require('json2csv').parse;
const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const sequelize = require('../../models/index').sequelize;
const Op = require('sequelize').Op;

const s3 = require('../../s3');

const fs = require('fs');


const database = require('../../models/index');
const Report = database.Report;
const Employee = database.Employee;
const ExpenseClaim = database.ExpenseClaim;
const ExpenseClaimItem = database.ExpenseClaimItem;
const EmployeeExpenseClaim = database.EmployeeExpenseClaim;
const CostCentre = database.CostCentre;


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
    Report.findAll({
        where: {
            type: {[Op.eq]: Report.TYPE.NAV}
        }
    }).then((reports) => {
        var simplifiedReports = _.map(reports, (report) => {
            var rep = {};
            rep['id'] = report.id;
            rep['type'] = report.type;

            // TODO: need to add status to reports
            // rep['status'] = report.status;

            return rep;
        });
        res.locals.reports = simplifiedReports;

        res.render('admin/NAVReport');
    });

});

router.post('/statistic', function (req, res, next) {
    helper(req).then(function () {
        res.redirect('/reports/statistics')
    }).catch(function (error) {
        next(error)
    })
});
router.post('/NAV', function (req, res, next) {
    // TODO deal with non-statistics reports
    console.log(req.body);
    generateT24Report(req.body.report_start_date, req.body.report_end_date);
});



function generateNAVReport(startDate, endDate){

}

function generateT24Report(startDate, endDate){
    async.waterfall([
        function(callback){
            ExpenseClaim.findAll({
                where: {
                    created_at: {[Op.gte]: startDate, [Op.lt]: endDate}
                }, include: [{
                    model: ExpenseClaimItem,
                }, {
                    model: EmployeeExpenseClaim,
                    where: {
                        isActive: {[Op.eq]: 1}
                    }
                }]
            }).then(function(expenseClaims){
                console.log(expenseClaims.length);
                var rows = _.map(expenseClaims, (expenseClaim) => {
                    var amount = _.reduce(expenseClaim.ExpenseClaimItem, (memo, expenseClaimItem) => {
                        return memo + expenseClaimItem.total;
                    }, 0);
                    var row = {
                        bank_number: expenseClaim.bankNumber,
                        currency_type: "CAD",
                        date: expenseClaim.createdAt,
                        status: expenseClaim.status,
                        dollar_amount: "$" + amount,
                        _51: "51",
                        CR: "CR",
                        "-": "-",
                        status: expenseClaim.status,
                        empty1:"",
                        empty2:"",
                        empty3:"",
                        dollar_value: amount,
                        bank_number2: expenseClaim.bankNumber,
                    };
                    return row;
                });

                var opts = {};
                opts['fields'] = rows[0].keys;
                opts['delimiter'] = "|";
                opts['header'] = false;
                opts['quote'] = "";

                var csv = json2csv(rows, opts);
                console.log(csv);

                var params = {
                    Bucket: s3.config.params.Bucket,
                    Key: "t24testreport",
                    Body: csv
                };
                s3.putObject(params, function(err, data){
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Successfully uploaded data to myBucket/myKey");
                        console.log("data returned:");
                        console.log(data);
                    }
                });
            });
        }
    ], function(err){
        if(err){
            console.log(err);
            next(err);
        } else {
            res.redirect('/reports/NAV');
        }
    });
}

module.exports = router;
