const async = require('async');
const express = require('express');
const router = express.Router();

const models = require('../../models/index');
const Report = models.Report;

// GET /reports
router.get('', function (req, res, next) {
    res.render('admin/statReport');
});

module.exports = router;
