'use strict';

const nodemailer = require('nodemailer');
const _ = require('underscore');
const Promise = require('promise');

const database = require('../models/index');
const Employee = database.Employee;

class Notifier {
  constructor() {
    var isSecure = process.env.ECA_SMTP_SECURE === 'true';
    this.transporter = nodemailer.createTransport({
      host: process.env.ECA_SMTP_HOST,
      port: parseInt(process.env.ECA_SMTP_PORT) || isSecure ? 465 : 587,
      secure: isSecure,
      auth: {
        user: process.env.ECA_SMTP_USERNAME,
        pass: process.env.ECA_SMTP_PASSWORD,
      }
    });
  }

  notifyCreate(submitterEmail, approverEmail, callback) {
    var subject = 'Expense Claim Approval Requested';
    var message = 'Hello, please find the attached link below.';

    return _notify.apply(this, Array.prototype.slice.call(arguments, 0, 2).concat([subject, message, callback]));
  }
}

function _notify(submitterEmail, approverEmail, subject, message, callback) {
  let mailOptions = {
    from: submitterEmail,
    to: approverEmail,
    subject: subject,
    text: message,
  };

  return new Promise(_.bind(function (resolve, reject) {
    this.transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        reject.apply(this, arguments);
      } else {
        resolve.apply(this, arguments);

        if (callback) {
          callback.apply(this, arguments);
        }
      }
    });
  }, this));
}

module.exports = Notifier;
