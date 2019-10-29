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

router.post('/:uname/:rname', controller.updateRestaurant);

router.get(
    '/:uname/:rname',
    controller.showRestaurant
);


router.get(
    '/:uname/:rname/edit',
    controller.editRestaurant
);

module.exports = router;