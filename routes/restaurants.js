var express = require('express');
var router = express.Router();

var controller = require('../controllers/restaurants.controller');
var common = require('../controllers/common.controller');

router.get('/', controller.showRestaurants);

router.post('/', common.ensureAuthenticatedRestaurantOwner, controller.addRestaurant)

router.get('/add', common.ensureAuthenticatedRestaurantOwner, controller.showRestaurantAddPage);

router.get(
    '/:rname',
    controller.showRestaurantProfile
);

module.exports = router;
