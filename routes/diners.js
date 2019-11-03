var express = require('express');
var router = express.Router();

var controller = require('../controllers/diners.controller');
var common = require('../controllers/common.controller');

router.get('/register', controller.registerDiner);
router.post(
  '/register',
  controller.registerValidations,
  controller.createDiner
);
router.get('/login', controller.getLoginPage);
router.get(
  '/reservations',
  common.ensureAuthenticatedDiner,
  controller.showReservations
);
router.get(
  '/incentives',
  common.ensureAuthenticatedDiner,
  controller.showIncentives
);
router.delete(
  common.ensureAuthenticatedDiner,
  controller.deleteDiner
);

module.exports = router;
