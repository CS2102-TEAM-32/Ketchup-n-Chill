var express = require('express');
var router = express.Router();

var controller = require('../controllers/index.controller');
var common = require('../controllers/common.controller');

router.get('/', function(req, res, next) {
  res.redirect('/home');
});

router.get('/home', common.showHomePage);

router.get('/login', controller.getLoginPage);

router.post('/login', common.login);

router.get('/logout', common.ensureAuthenticatedAny, common.logout);

router.get('/profile', common.showProfile);

module.exports = router;
