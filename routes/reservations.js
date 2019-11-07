var express = require('express');
var router = express.Router();

var controller = require('../controllers/reservations.controller');
var common = require('../controllers/common.controller');

router.get('/', common.ensureAuthenticatedRestaurantOwner, controller.showAllReservations);

router.post('/', common.ensureAuthenticatedRestaurantOwner, controller.setComplete);

module.exports = router;
