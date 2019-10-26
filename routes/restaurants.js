var express = require('express');
var router = express.Router();

var controller = require('../controllers/restaurants.controller');

router.get('/', controller.showRestaurants);
router.get(
    '/:rname',
    controller.showRestaurantProfile
);

module.exports = router;
