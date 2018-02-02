const express = require('express');
const router = express.Router();
const models = require('../models/index');
const ExpenseClaim = models.ExpenseClaim;

/* GET /claims/new */
router.get('/new', function (req, res, next) {
  res.render('claims/new', { title: 'Expense Claim' });
});

router.get('/:id', function (req, res, next) {
  var expenseClaimId = req.params.id;
  ExpenseClaim.findById(expenseClaimId).then((expenseClaim) => {
    if (expenseClaim) {
      res.locals.id = expenseClaimId;
      res.locals.status = expenseClaim.status;

      res.render('claims/detail');
    } else {
      next();
    }
  });
});

/* POST /claims */
router.post('', function (req, res, next) {
  new ExpenseClaim({
    status: 'pending',
  }).then((expenseClaim) => {
    res.redirect('/claims/' + expenseClaim.id);
  });
});

module.exports = router;
