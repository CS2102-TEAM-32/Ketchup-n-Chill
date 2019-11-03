var express = require('express');
var router = express.Router();

var controller = require('../controllers/menus.controller');
var common = require('../controllers/common.controller');

router.post(
  '/:rname/:raddress',
  common.ensureAuthenticatedRestaurantOwner,
  controller.addMenu
);

router.get(
  '/:rname/:raddress/add',
  common.ensureAuthenticatedRestaurantOwner,
  controller.showAddMenuPage
);

router.get('/:rname/:raddress/:title', controller.showMenu);

router.delete(
  '/:rname/:raddress/:title',
  common.ensureAuthenticatedRestaurantOwner,
  controller.deleteMenu
);

module.exports = router;
