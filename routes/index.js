var express = require('express');
var router = express.Router();

var controller = require('../controllers/index.controller');

router.get('/', function(req, res, next) {
  res.redirect('/home');
});

router.get('/home', controller.showHomePage);

module.exports = router;
