var express = require('express');
var router = express.Router();

/* GET /claim */
router.get('/', function(req, res, next) {
  res.render('claims/new', { title: 'Expense Claim' });
});

module.exports = router;
