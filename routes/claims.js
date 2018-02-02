var express = require('express');
var router = express.Router();

/* GET /claims/new */
router.get('/new', function(req, res, next) {
  res.render('claims/new', { title: 'Expense Claim' });
});

module.exports = router;
