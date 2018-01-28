var express = require('express');
var router = express.Router();

// GET /logout
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Logout' });
});

module.exports = router;
