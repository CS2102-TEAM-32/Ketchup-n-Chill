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
  '/claim',
  controller.claimVoucher
);
router.get('/account', function (req, res, next) {
  const page = 'account/' + [req.user.uname];
  console.log(page);
  res.redirect(page);
});
router.delete(
  common.ensureAuthenticatedDiner,
  controller.deleteDiner
);

module.exports = router;
