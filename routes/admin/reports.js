const moment = require('moment');
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
        default:
            return handleGetNonStatReport(req, res, next);
    }

});

function handleGetStatistics(req, res, next){
    res.locals.title = 'Statistics Report';

    res.locals.submitterName = req.session.submitterName;
    res.locals.allSubmitters = req.session.allSubmitters || !req.session.submitterName;
    req.session.submitterName = null;
    req.session.allSubmitters = null;

    res.locals.approverName = req.session.approverName;
    res.locals.allApprovers = req.session.allApprovers || !req.session.approverName;
    req.session.allApprovers = null;
    req.session.approverName = null;

    res.locals.reportStartDate = req.session.reportStartDate;
    res.locals.reportEndDate  = req.session.reportEndDate;
    res.locals.allDates = req.session.allDates || !(req.session.reportStartDate || req.session.reportEndDate);
    req.session.reportStartDate = null;
    req.session.reportEndDate  = null;
    req.session.allDates = null;

    res.locals.costCentreName = req.session.costCentreName;
    res.locals.allCostCentres = req.session.allCostCentres || !req.session.costCentreName;
    req.session.costCentreName = null;
    req.session.allCostCentres = null;

    res.locals.submitted = req.session.submitted;
    res.locals.pending = req.session.pending;
    res.locals.approved = req.session.approved;
    res.locals.declined = req.session.declined;
    req.session.submitted = null;
    req.session.pending = null;
    req.session.approved = null;
    req.session.declined = null;

    async.waterfall([
        function(callback){
            Employee.findAll().then((employees) => {
                let simpleEmployees = _.map(employees, (employee) => {
                    var emp = {};
                    emp.name = employee.name;
                    // emp.id = employee.id;
                    return emp;
                });
                res.locals.employees = simpleEmployees;
                callback(null);
            });
        }, function(callback){
            CostCentre.findAll().then((costCentres) =>{
                let simpleCostCentres = _.map(costCentres, (costCentre) => {
                    var cc = {};
                    cc.name = costCentre.name;
                    // cc.number = costCentre.number;
                    return cc;
                });
                res.locals.cost_centres = simpleCostCentres;
                callback(null);
            });
        }
    ], function(err){
        if(err){
            console.log('get stats page failed!');
            next(err);
        } else {
            res.render('admin/statReport');
        }
    });
}

function handleGetNonStatReport(req, res, next){
    res.locals.title = 'NAV Report';
    Report.findAll().then((reports) => {
        var simplifiedReports = _.map(reports, (report) => {
            var rep = {};
            rep['id'] = report.id;
            rep['type'] = report.type;
            rep['report_download'] = '/reports/' + report.id;

            return rep;
        });
        res.locals.reports = simplifiedReports;

        res.render('admin/AdminReport');
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
    switch(req.body.report_type){
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
                    req.session.submitterName = submitter.name;
                    submitterId = submitter.id;
                } else if(!req.body.submitter_name){
                    req.session.allSubmitters = true;
                }

                Employee.findOne({
                    where: {
                        [Op.or]: [
                            {id: {[Op.like]: '%' + req.body.approver_name + '%'}},
                            {name: {[Op.like]: '%' + req.body.approver_name + '%'}}]}
                }).then((approver) => {
                    if(approver && req.body.approver_name){
                        req.session.approverName = approver.name;
                        approverId = approver.id;
                    } else if(!req.body.approver_name){
                        req.session.allApprovers = true;
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
                        req.session.approverName = req.body.approver_name + ' was not found!';
                    }
                    if(!submitterId){
                        req.session.submitterName = req.body.submitter_name + ' was not found!';
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
                    req.session.submitterName = req.body.submitter_name + ' was not found!'
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
                    req.session.approverName = req.body.approver_name + ' was not found!';
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
                            req.session.costCentreName = costCentre.name;
                            whereBlock['costCentreId'] = {[Op.eq]: costCentre.id};
                        } else {
                            req.session.costCentreName = req.body.cost_centre + " was not found!";
                            return callback(null, []);
                        }
                    } else {
                        req.session.allCostCentres = true;
                    }

                    if(!req.body.all_dates){
                        if(req.body.report_start_date && req.body.report_end_date){
                            req.session.reportStartDate = req.body.report_start_date;
                            req.session.reportEndDate = req.body.report_end_date;
                            whereBlock['created_at'] = {[Op.gte]: req.body.report_start_date, [Op.lte]: moment(req.body.report_end_date).endOf("day")};
                        } else if(req.body.report_start_date){
                            req.session.reportStartDate = req.body.report_start_date;
                            whereBlock['created_at'] = {[Op.gte]: req.body.report_start_date};
                        } else if(req.body.report_end_date){
                            req.session.reportEndDate = req.body.report_end_date;
                            whereBlock['created_at'] = {[Op.lte]: moment(req.body.report_end_date).endOf("day")};
                        } else {
                            req.session.allDates = true;
                        }
                    } else {
                        req.session.allDates = true;
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
            req.session.submitted = expenseClaims.length;
            req.session.pending = summary[ExpenseClaim.STATUS.PENDING] || 0;
            req.session.approved = summary[ExpenseClaim.STATUS.APPROVED] || 0;
            req.session.declined = summary[ExpenseClaim.STATUS.REJECTED] || 0;
            callback(null);
        }
    ], function (err) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            res.redirect('/reports?report_type=statistics');
            // res.render('admin/statReport');
        }
    });
}

function generatePayrollReport(req, res, next){

}

function generateT24Report(req, res, next){
    var startDate = req.body.report_start_date;
    var endDate = req.body.report_end_date;
    ExpenseClaim.findAll({
        where: {
            status: ExpenseClaim.STATUS.APPROVED,
            created_at: {[Op.gte]: startDate, [Op.lte]: moment(endDate).endOf("day")},
            bankNumber: {[Op.regexp]: '^[0-9]+$'}
        }, include: [{
            model: ExpenseClaimItem,
        }, {
            model: EmployeeExpenseClaim,
            where: {
                isActive: {[Op.eq]: 1}
            }
        }]
    }).then(function(expenseClaims){
        if(expenseClaims.length === 0){
            req.flash('error', 'No relevant claims in date range!');
            return res.redirect('/reports?report_type=nav');
        }

        generateCSVReport(expenseClaims, req.user.id, Report.TYPE.T24);
        return res.redirect('/reports?report_type=nav');
    });
}

function generateNAVReport(req, res, next){
    var startDate = req.body.report_start_date;
    var endDate = req.body.report_end_date;
    ExpenseClaim.findAll({
        where: {
            status: ExpenseClaim.STATUS.APPROVED,
            created_at: {[Op.gte]: startDate, [Op.lte]: moment(endDate).endOf("day")}
        }, include: [{
            model: ExpenseClaimItem,
        }, {
            model: EmployeeExpenseClaim,
            where: {
                isActive: {[Op.eq]: 1}
            }
        }]
    }).then(function(expenseClaims){
        if(expenseClaims.length === 0){
            req.flash('error', 'No claims in date range!');
            return res.redirect('/reports?report_type=nav');
        }

        generateCSVReport(expenseClaims, req.user.id, Report.TYPE.NAV);
        return res.redirect('/reports?report_type=nav');
    });
}

function generateCSVReport(expenseClaims, userId, reportType){
    if(expenseClaims.length === 0){
        return;
    }

    var rows = _.map(expenseClaims, (expenseClaim) => {
        var amount = _.reduce(expenseClaim.ExpenseClaimItems, (memo, expenseClaimItem) => {
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

    return sequelize.transaction(function(t){
        return Report.create({
            employeeId: userId,
            type: reportType,
        }, {transaction: t}).then(function(newReport){
            let reportKey = getReportName(newReport.id);
            return newReport.update({key: reportKey}, {fields:['key'], transaction:t}).then((updatedReport) => {
                let params = {
                    Bucket: s3.config.params.Bucket,
                    Key: reportKey,
                    Body: csv
                };
                s3.putObject(params, function(err, data){
                    if (err) {
                        console.log("aws s3 report storage failed!");
                        console.log(err)
                    } else {
                        console.log("aws s3 report storage success!");
                        updatedReport.downloadLink = "http://"+ s3.config.params.Bucket +".s3.amazonaws.com/" + reportKey;
                        updatedReport.save({fields: ['downloadLink']});
                    }
                });
            }).catch(function(err){
                console.log("report key updating failed!");
                console.log(err);
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
    Report.findOne({
        where: {id: {[Op.eq]: req.params.id}}
    }).then((report) => {
        if(!report){
            req.flash('error', 'No relevant claims in date range!');
            return res.redirect('/reports?report_type=nav');
        } else if(!report.key){
            req.flash('error', 'Report key missing, failed to delete!');
            return res.redirect('/reports?report_type=nav');
        }

        let params = {};
        params.Bucket = s3.config.params.Bucket;
        params.Key = report.key;
        s3.deleteObject(params, function(err, data){
            if(err){
                console.log("failed to delete aws s3 report object!");
                console.log(err);
                req.flash('error', 'Failed to delete!');
                return res.redirect('/reports?report_type=nav');
            } else {
                report.destroy().then(() => {
                    req.flash('error', 'Report deleted!');
                    return res.redirect('/reports?report_type=nav');
                });
            }
        });
    });
});


module.exports = router;
