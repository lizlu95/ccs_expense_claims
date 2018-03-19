const express = require('express');
const router = express.Router();
const passport = require('passport');
const _ = require('underscore');

// GET /login
router.get('/', function(req, res, next) {
  if (req.user) {
    res.redirect('/');
  } else {
    res.locals.title = 'Log In';
    var error = req.flash('error');
    if (!_.isEmpty(error)) {
      res.locals.error = error;
    }
    res.render('authenticate/login');
  }
});

// POST /login
router.post('/', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true,
}), function (req, res) {
  res.redirect(req.session.returnTo || '/');
});

module.exports = router;
