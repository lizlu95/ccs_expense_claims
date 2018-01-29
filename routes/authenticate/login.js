const express = require('express');
const router = express.Router();
const passport = require('passport');

// GET /login
router.get('/', function(req, res, next) {
  res.render('authenticate/login', { title: 'Login' });
});

// POST /login
router.post('/', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}));

module.exports = router;
