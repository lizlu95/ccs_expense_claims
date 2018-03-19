const async = require('async');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const sequelize = require('../../models/index').sequelize;
const Op = require('sequelize').Op;


const database = require('../../models/index');
const Report = database.Report;
const Employee = database.Employee;
const ExpenseClaim = database.ExpenseClaim;
const EmployeeExpenseClaim = database.EmployeeExpenseClaim;
const CostCentre = database.CostCentre;

/* GET /reports */
router.get('', function (req, res, next) {
  res.locals.title = 'Reports';
  res.locals.allSubmitters = true;
  res.locals.allApprovers = true;
  res.locals.allDates = true;
  res.locals.allCostCentres = true;

  res.render('admin/statReport');
});


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
    // TODO deal with non-statistics reports
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
            // TODO: render something else?
            res.render('admin/statReport');
        }
    });
});

// GET /reports/:id
router.get('/:id', function (req, res, next) {
    Report.findById(req.params.id).then(function(report){
        // TODO this does not work
        res.status(200);
        res.send(report);

        // TODO deal with other types of reports
        // NAV, T24, PAYROLL
    })
});

// DELETE /reports/:id
router.delete('/:id', function(req, res, next){
    // TODO: add new is_deleted column to reports table
    // modify column to delete report
});

module.exports = router;
