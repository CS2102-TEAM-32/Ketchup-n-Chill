var express = require('express');
var router = express.Router();

var controller = require('../controllers/restaurantOwners.controller');
var common = require('../controllers/common.controller');

//router.get('/', function (req, res, next) {
  //  res.redirect('/restaurantowners');
//});

router.get('/', controller.showHomePage);

router.get('/register', controller.registerRestaurantOwner);
router.post(
    '/register',
    controller.registerValidations,
    controller.createRestaurantOwner
);
router.get(
    '/:uname',
    common.ensureAuthenticatedRestaurantOwner,
    controller.showHomePage
);

router.post('/:uname/:rname/:raddress', controller.updateRestaurant);

router.get(
    '/:uname/:rname/:raddress',
    common.ensureAuthenticatedRestaurantOwner,
    controller.showRestaurant
);


router.get(
    '/:uname/:rname/:raddress/edit',
    common.ensureAuthenticatedRestaurantOwner,
    controller.editRestaurant
);

router.get(
    '/:uname/:rname/:raddress/edittimeslot',
    common.ensureAuthenticatedRestaurantOwner,
    controller.editTimeslots
);

router.post('/:uname/:rname/:raddress/updatetimeslot', common.ensureAuthenticatedRestaurantOwner, controller.updateTimeslot);

module.exports = router;