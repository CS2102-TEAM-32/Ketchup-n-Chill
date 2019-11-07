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

router.get('/:rname/:raddress/:title/edit', controller.editMenu);

router.delete(
  '/:rname/:raddress/:title/:fname',
  common.ensureAuthenticatedRestaurantOwner,
  controller.deleteMenuItem
);

router.delete(
  '/:rname/:raddress/:title',
  common.ensureAuthenticatedRestaurantOwner,
  controller.deleteMenu
);

module.exports = router;
