'use strict';

const nodemailer = require('nodemailer');
const _ = require('underscore');
const async = require('async');
const Promise = require('promise');

const database = require('../models/index');
const Employee = database.Employee;

class Notifier {
  constructor(req) {
    this.baseUrl = req.protocol + '://' + req.get('host');
    this.fromEmail = process.env.ECA_SMTP_FROM_EMAIL;

    var isSecure = process.env.ECA_SMTP_SECURE === 'true';
    this.transporter = nodemailer.createTransport({
      host: process.env.ECA_SMTP_HOST || '',
      port: parseInt(process.env.ECA_SMTP_PORT) || isSecure ? 465 : 587,
      secure: isSecure,
      auth: {
        user: process.env.ECA_SMTP_USERNAME || '',
        pass: process.env.ECA_SMTP_PASSWORD || '',
      }
    });
  }

  notifyExpenseClaimSubmitted(submitterId, approverId, expenseClaimId, callback) {
    var submitterSubject = 'Expense Claim ' + expenseClaimId + ' Approval Submitted';
    var submitterMessage = 'Hello, please find your submitted request at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId;
    var approverSubject = 'Expense Claim ' + expenseClaimId + ' Approval Requested';
    var approverMessage = 'Hello, your review has been requested for the expense claim at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId;

    return new Promise(_.bind((resolve, reject) => {
      async.series({
        submitter: (callback) => {
          _notifyById.apply(this, [submitterId, submitterSubject, submitterMessage, callback]);
        },
        approver: (callback) => {
          _notifyById.apply(this, [approverId, approverSubject, approverMessage, callback]);
        },
      }, (err, errs) => {
        // object of errs for submitter/approver
        // e.g. { submitter: err, approver: err }
        resolve(errs);

        if (callback) {
          callback(errs);
        }
      });
    }, this));
  }

  notifyExpenseClaimStatusChange(submitterId, approverId, expenseClaimId, status, callback) {
    var submitterSubject = 'Expense Claim ' + expenseClaimId + ' Status Change';
    var submitterMessage = 'Hello, the status of your expense claim at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId +
        'has changed to ' + status + '.';
    var approverSubject = 'Expense Claim ' + expenseClaimId + ' Status Change';
    var approverMessage = 'Hello, you have successfully changed the status of your managed expense claim at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId +
        ' to ' + status + '.';

    return new Promise(_.bind((resolve, reject) => {
      async.series({
        submitter: (callback) => {
          _notifyById.apply(this, [submitterId, submitterSubject, submitterMessage, callback]);
        },
        approver: (callback) => {
          _notifyById.apply(this, [approverId, approverSubject, approverMessage, callback]);
        },
      }, (err, errs) => {
        // object of errs for submitter/approver
        // e.g. { submitter: err, approver: err }
        resolve(errs);

        if (callback) {
          callback(errs);
        }
      });
    }, this));
  }

  notifyExpenseClaimForwarded(submitterId, forwarderId, forwardeeId, forwardeeName, expenseClaimId, callback) {
    var submitterSubject = 'Expense Claim ' + expenseClaimId + ' Forwarded';
    var submitterMessage = 'Hello, your expense claim at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId +
        ' has been forwarded to ' + forwardeeName;
    var forwarderSubject = 'Expense Claim ' + expenseClaimId + 'Forwarded';
    var forwarderMessage = 'Hello, you have successfully forwarded the expense claim at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId +
        ' to ' + forwardeeName + '.';
    var forwardeeSubject = 'Expense Claim Approval Requested';
    var forwardeeMessage = 'Hello, your review has been requested for the expense claim at ' +
        this.baseUrl +
        '/claims/' +
        expenseClaimId;

    return new Promise(_.bind((resolve, reject) => {
      async.series({
        submitter: (callback) => {
          _notifyById.apply(this, [submitterId, submitterSubject, submitterMessage, callback]);
        },
        forwarder: (callback) => {
          _notifyById.apply(this, [forwarderId, forwarderMessage, forwarderMessage, callback]);
        },
        forwardee: (callback) => {
          _notifyById.apply(this, [forwardeeId, forwardeeMessage, forwardeeMessage, callback]);
        },
      }, (err, errs) => {
        // object of errs for submitter/approver
        // e.g. { submitter: err, approver: err }
        resolve(errs);

        if (callback) {
          callback(errs);
        }
      });
    }, this));
  }
}



function _notify(to, subject, message, callback) {
  let mailOptions = {
    from: this.fromEmail,
    to: to,
    subject: subject,
    text: message,
  };

  return new Promise(_.bind(function (resolve, reject) {
    this.transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        reject.apply(this, [err]);
      } else {
        resolve.apply(this, [info]);

        if (callback) {
          callback.apply(this, [info]);
        }
      }
    });
  }, this));
}

function _notifyById (employeeId, subject, message, callback) {
  async.waterfall([
    (callback) => {
      Employee.findById(employeeId).then((employee) => {
        if (employee) {
          callback(null, employee);
        } else {
          callback('Could not find employee.');
        }
      });
    },
    (employee, callback) => {
      var to = employee.name + '<' + employee.email + '>';
      _notify.apply(this, [to, subject, message])
        .then((info) => {
          callback(null);
        })
        .catch((err) => {
          callback(null, err);
        });
    },
  ], (err) => {
    // continue chain regardless but pass err forward in series
    callback(null, err);
  });
};

module.exports = Notifier;
