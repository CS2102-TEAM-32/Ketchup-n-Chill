var express = require('express');
var router = express.Router();

var controller = require('../controllers/diners.controller');

router.get('/', controller.ensureAuthenticated, controller.showAllDiners);
router.get('/register', controller.registerDiner);
router.post(
  '/register',
  controller.registerValidations,
  controller.createDiner
);
router.get('/login', controller.getLoginPage);
router.post('/login', controller.logDinerIn);
router.get('/logout', controller.ensureAuthenticated, controller.logDinerOut);
router.get(
  '/reservations/:uname',
  controller.ensureAuthenticated,
  controller.showReservations
);
router.get(
  '/incentives/:uname',
  controller.ensureAuthenticated,
  controller.showIncentives
);
router.delete(
  '/:uname',
  controller.ensureAuthenticated,
  controller.deleteDiner
);
router.get(
  '/:uname',
  controller.ensureAuthenticated,
  controller.showDinerProfile
);

module.exports = router;
