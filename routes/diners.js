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
router.get(
  '/vouchers',
  common.ensureAuthenticatedDiner,
  controller.showVouchers
);
router.get(
  '/reviews',
  common.ensureAuthenticatedDiner,
  controller.showReviews
);
router.get(
  '/claim',
  controller.claimVoucher
);
router.get(
  '/redeem',
  controller.redeemVoucher
);
router.get(
  '/addreview',
  controller.addReview
);
router.get(
  '/editreservation',
  controller.editReservation
);
router.get(
  '/cancelreservation',
  controller.cancelReservation
);
router.delete(
  common.ensureAuthenticatedDiner,
  controller.deleteDiner
);

module.exports = router;
