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

// need to rethink: if we do this, can't really prevent people from 'snooping'?
router.get(
    '/:uname',
    common.ensureAuthenticatedRestaurantOwner,
    controller.showHomePage
);

router.post('/:rname/:raddress', controller.updateRestaurant);

router.get(
    '/:rname/:raddress',
    common.ensureAuthenticatedRestaurantOwner,
    controller.showRestaurant
);


router.get(
    '/:rname/:raddress/edit',
    common.ensureAuthenticatedRestaurantOwner,
    controller.editRestaurant
);

router.get(
    '/:rname/:raddress/edittimeslot',
    common.ensureAuthenticatedRestaurantOwner,
    controller.editTimeslots
);

router.post('/:rname/:raddress/updatetimeslot', common.ensureAuthenticatedRestaurantOwner, controller.updateTimeslot);

module.exports = router;