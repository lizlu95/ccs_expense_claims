'use strict';

const nodemailer = require('nodemailer');
const _ = require('underscore');
const async = require('async');
const Promise = require('promise');

const database = require('../models/index');
const Employee = database.Employee;

class Notifier {
  constructor() {
    // TODO make this system configurable
    this.fromEmail = 'no-reply@ccs-expense-claims.herokuapp.com';

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

  notifyExpenseClaimSubmitted(submitterEmail, approverEmail, callback) {
    var submitterSubject = 'Expense Claim Approval Submitted';
    var submitterMessage = 'Hello, please find your submitted request link below.';
    var approverSubject = 'Expense Claim Approval Requested';
    var approverMessage = 'Hello, please find the attached link below.';

    return new Promise(_.bind((resolve, reject) => {
      async.series({
        submitter: (callback) => {
          _notify.apply(this, [submitterEmail, submitterSubject, submitterMessage])
            .then((info) => {
              callback(null);
            })
            .then((err) => {
              callback(null, err);
            });
        },
        approver: (callback) => {
          _notify.apply(this, [approverEmail, approverSubject, approverMessage])
            .then((info) => {
              callback(null);
            })
            .then((err) => {
              callback(null, err);
            });
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

function _notify(email, subject, message, callback) {
  let mailOptions = {
    from: this.fromEmail,
    to: email,
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

module.exports = Notifier;
