var express = require('express');
var router = express.Router();

var controller = require('../controllers/restaurantOwners.controller');
var commoncontroller = require('../controllers/index.controller')
var common = require('../controllers/common.controller');

router.get('/register', controller.registerRestaurantOwner);
router.post(
    '/register',
    controller.registerValidations,
    controller.createRestaurantOwner
);

router.get('/login', commoncontroller.getLoginPage);

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

router.delete('/:rname/:raddress/:date/:time', common.ensureAuthenticatedRestaurantOwner, controller.deleteTimeslots);

router.post('/:rname/:raddress/updatetimeslot', common.ensureAuthenticatedRestaurantOwner, controller.updateTimeslot);

module.exports = router;