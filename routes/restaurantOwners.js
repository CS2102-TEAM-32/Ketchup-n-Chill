var express = require('express');
var router = express.Router();

var controller = require('../controllers/restaurantOwners.controller');

//router.get('/', function (req, res, next) {
  //  res.redirect('/restaurantowners');
//});

router.get('/', controller.showHomePage);

router.get(
    '/:uname',
    controller.showHomePage
);

router.get(
    '/:uname/:rname',
    controller.showRestaurant
);

module.exports = router;