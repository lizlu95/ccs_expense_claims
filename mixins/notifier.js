'use strict';

const nodemailer = require('nodemailer');
const _ = require('underscore');

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

  notifyCreate(submitterId, approverId, callback) {
    var subject = 'Creation';
    var message = 'Message';
    _notify.apply(this, Array.prototype.slice.call(arguments, 0, 2).concat([subject, message, callback]));
  }
}

function _notify(submitterId, approverId, subject, message, callback) {
  let mailOptions = {
    from: '',
    to: '',
    subject: subject,
    text: message,
  };

  this.transporter.sendMail(mailOptions, (err, info) => {
    if (callback) {
      callback(err, info);
    }
  });
}

module.exports = Notifier;
