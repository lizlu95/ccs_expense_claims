const json2csv = require('json2csv').parse;
const async = require('async');
const express = require('express');
const router = express.Router();

const _ = require('underscore');

const sequelize = require('../../models/index').sequelize;
const Op = require('sequelize').Op;

const s3 = require('../../s3');


const database = require('../../models/index');
const Report = database.Report;
const Employee = database.Employee;
const ExpenseClaim = database.ExpenseClaim;
const ExpenseClaimItem = database.ExpenseClaimItem;
const EmployeeExpenseClaim = database.EmployeeExpenseClaim;
const CostCentre = database.CostCentre;


/* GET /reports */
router.get('', function (req, res, next) {
    switch(req.query.report_type){
        case Report.TYPE.STATS:
            return handleGetStatistics(req, res, next);
        case Report.TYPE.NAV:
        case Report.TYPE.T24:
        case Report.TYPE.PAYROLL:
            return handleGetNonStatReport(req, res, next);
        default:
            return handleGetReport(req, res, next);
    }

});

function handleGetReport(req, res, next){
    res.locals.title = 'Reports';
    res.locals.STAT = Report.TYPE.STATS;
    res.locals.NAV = Report.TYPE.NAV;

    res.render('admin/reportIndex');
}

function handleGetStatistics(req, res, next){
    res.locals.title = 'Statistics Report';
    res.locals.allSubmitters = true;
    res.locals.allApprovers = true;
    res.locals.allDates = true;
    res.locals.allCostCentres = true;

    res.render('admin/statReport');
}

function handleGetNonStatReport(req, res, next){
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
            rep['report_download'] = '/reports/' + report.id;

            return rep;
        });
        res.locals.reports = simplifiedReports;

        res.render('admin/NAVReport');
    });

}


// POST /reports
// create report generation request from given parameters
// parameters:
//      report_type
//      report_start_date
//      report_end_date
//      cost_centre_ids (optional)
//      submitter_name    (optional)
//      approver_name     (optional)
router.post('', function(req, res, next){
    switch(req.query.report_type){
        case Report.TYPE.STATS:
            return generateStatsReport(req, res, next);
        case Report.TYPE.NAV:
            return generateNAVReport(req, res, next);
        case Report.TYPE.T24:
            return generateT24Report(req, res, next);
        case Report.TYPE.PAYROLL:
            return generatePayrollReport(req, res, next);
        default:
            return next();
    }
});

function generateStatsReport(req, res, next){
    async.waterfall([
        function(callback){
            var submitterId = null;
            var approverId = null;

            // TODO better name search
            Employee.findOne({
                where: {
                    [Op.or]: [
                        {id: {[Op.like]: '%' + req.body.submitter_name + '%'}},
                        {name: {[Op.like]: '%' + req.body.submitter_name + '%'}}]}
            }).then((submitter) => {
                if(submitter && req.body.submitter_name){
                    res.locals.submitterName = submitter.name;
                    submitterId = submitter.id;
                } else if(!req.body.submitter_name){
                    res.locals.allSubmitters = true;
                }

                Employee.findOne({
                    where: {
                        [Op.or]: [
                            {id: {[Op.like]: '%' + req.body.approver_name + '%'}},
                            {name: {[Op.like]: '%' + req.body.approver_name + '%'}}]}
                }).then((approver) => {
                    if(approver && req.body.approver_name){
                        res.locals.approverName = approver.name;
                        approverId = approver.id;
                    } else if(!req.body.approver_name){
                        res.locals.allApprovers = true;
                    }

                    callback(null, submitterId, approverId);
                })
            });
        },
        function(submitterId, approverId, callback){
            // filter all relevant employeeExpenseClaims by submitter/approver specification
            if((req.body.all_approvers || !req.body.approver_name) && (req.body.all_submitters || !req.body.submitter_name)){
                EmployeeExpenseClaim.findAll()
                    .then(function(employeeExpenseClaims){
                        callback(null, employeeExpenseClaims);
                    });
            } else if(!req.body.all_approvers && req.body.approver_name && !req.body.all_submitters && req.body.submitter_name){
                if(!approverId || !submitterId){
                    if(!approverId){
                        res.locals.approverName = req.body.approver_name + ' was not found!';
                    }
                    if(!submitterId){
                        res.locals.submitterName = req.body.submitter_name + ' was not found!';
                    }

                    return callback(null, []);
                }

                EmployeeExpenseClaim.findAll({
                    where: {
                        employeeId: {[Op.eq]: submitterId},
                        isActive: {[Op.eq]: 1},
                        isOwner: {[Op.eq]: 1}
                    }, include: [{
                        model: EmployeeExpenseClaim,
                        where: {
                            employeeId: {[Op.eq]: approverId},
                            isActive: {[Op.eq]: 1},
                            isOwner: {[Op.eq]: 0}
                        }
                    }]
                }).then((employeeExpenseClaims) => {
                    callback(null, employeeExpenseClaims);
                });
            } else if(!req.body.all_submitters && req.body.submitter_name && (req.body.all_approvers || !req.body.approver_name)){
                if(!submitterId){
                    res.locals.submitterName = req.body.submitter_name + ' was not found!'
                    return callback(null, []);
                }

                EmployeeExpenseClaim.findAll({
                    where: {
                        employee_id: {[Op.eq]: submitterId},
                        isOwner: {[Op.eq]: 1},
                        isActive: {[Op.eq]: 1}}})
                    .then(function(employeeExpenseClaims){
                        callback(null, employeeExpenseClaims);
                    });
            } else if(!req.body.all_approvers && req.body.approver_name && (req.body.all_submitters || !req.body.submitter_name)){
                if(!approverId){
                    res.locals.approverName = req.body.approver_name + ' was not found!';
                    return callback(null, []);
                }

                EmployeeExpenseClaim.findAll({
                    where: {
                        employee_id: {[Op.eq]: approverId},
                        isOwner: {[Op.eq]: 0},
                        isActive: {[Op.eq]: 1}}})
                    .then(function (employeeExpenseClaims) {
                        callback(null, employeeExpenseClaims);
                    });
            } else {
                // is this code reachable?
                callback("Employees not specified properly!");
            }
        },
        function(employeeExpenseClaims, callback){
            // get expenseClaims from employeeExpenseClaims
            var expenseClaimIds = _.unique(_.map(employeeExpenseClaims, (employeeExpenseClaim) => {
                return employeeExpenseClaim.expenseClaimId;
            }));

            // TODO better name search
            CostCentre.findOne({
                where: {
                    [Op.or]: [
                        {number: {[Op.like]: '%' + req.body.cost_centre + '%'}},
                        {name: {[Op.like]: '%' + req.body.cost_centre + '%'}}]}})
                .then((costCentre) => {
                    var whereBlock = {};
                    whereBlock['id'] = {[Op.in]: expenseClaimIds};

                    if(req.body.cost_centre && !req.body.all_cost_centres){
                        if(costCentre){
                            res.locals.costCentreName = costCentre.name;
                            whereBlock['costCentreId'] = {[Op.eq]: costCentre.id};
                        } else {
                            res.locals.costCentreName = req.body.cost_centre + " was not found!";
                            return callback(null, []);
                        }
                    } else {
                        res.locals.allCostCentres = true;
                    }

                    if(!req.body.all_dates){
                        if(req.body.report_start_date && req.body.report_end_date){
                            res.locals.reportStartDate = req.body.report_start_date;
                            res.locals.reportEndDate = req.body.report_end_date;
                            whereBlock['created_at'] = {[Op.gte]: req.body.report_start_date, [Op.lt]: req.body.report_end_date};
                        } else if(req.body.report_start_date){
                            res.locals.reportStartDate = req.body.report_start_date;
                            whereBlock['created_at'] = {[Op.gte]: req.body.report_start_date};
                        } else if(req.body.report_end_date){
                            res.locals.reportEndDate = req.body.report_end_date;
                            whereBlock['created_at'] = {[Op.lt]: req.body.report_end_date};
                        } else {
                            res.locals.allDates = true;
                        }
                    } else {
                        res.locals.allDates = true;
                    }

                    ExpenseClaim.findAll({
                        where: whereBlock
                    }).then((expenseClaims) => {
                        callback(null, expenseClaims);
                    });
                });
        },
        function(expenseClaims, callback){
            var summary = _.countBy(expenseClaims, function(expenseClaim){
                return expenseClaim.status;
            });
            // use expenseClaims to get all relevant info
            res.locals.submitted = expenseClaims.length;
            res.locals.pending = summary[ExpenseClaim.STATUS.PENDING] || 0;
            res.locals.approved = summary[ExpenseClaim.STATUS.APPROVED] || 0;
            res.locals.declined = summary[ExpenseClaim.STATUS.REJECTED] || 0;
            callback(null);
        }
    ], function (err) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            res.render('admin/statReport');
        }
    });
}

function generatePayrollReport(req, res, next){

}

function generateNAVReport(req, res, next){

}

function generateNAVReport(req, res, next){
    var startDate = req.body.report_start_date;
    var endDate = req.body.report_end_date;
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
                status2: expenseClaim.status,
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

        sequelize.transaction(function(t){
            return Report.create({
                employeeId: req.user.id,
                type: Report.TYPE.NAV,
            }, {transaction: t});
        }).then(function(newReport){
            let params = {
                Bucket: s3.config.params.Bucket,
                Key: getReportName(newReport.id),
                Body: csv
            };
            s3.putObject(params, function(err, data){
                if (err) {
                    console.log("aws s3 report storage failed!");
                    console.log(err)
                } else {
                    console.log("aws s3 report storage success!");
                    newReport.downloadLink = "http://"+ s3.config.params.Bucket +".s3.amazonaws.com/" + getReportName(newReport.id);
                    newReport.save({fields: ['downloadLink']}).then(() => {
                        res.redirect('/reports?report_type=nav');
                    })
                }
            });
        }).catch(function(err){
            console.log("report db entry creation failed!");
            console.log(err);
        });
    });
}

function getReportName(id){
    return "report" + id + ".csv";
}


// GET /reports/:id
router.get('/:id', function (req, res, next) {
    Report.findById(req.params.id).then(function(report){
        res.redirect(report.downloadLink);
    })
});

// DELETE /reports/:id
router.delete('/:id', function(req, res, next){
    // TODO remove s3 file, then remove local entry
});

module.exports = router;
