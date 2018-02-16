const express = require('express');
const router = express.Router();
const passport = require('passport');

// GET /login
router.get('/', function(req, res, next) {
  if (req.user) {
    res.redirect('/');
  } else {
    res.locals.title = 'Log In';

    res.render('authenticate/login');
  }
});

// POST /login
router.post('/', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}));

module.exports = router;
