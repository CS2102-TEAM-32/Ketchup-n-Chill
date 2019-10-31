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
  '/reservations',
  controller.ensureAuthenticated,
  controller.showReservations
);
router.get(
  '/incentives',
  controller.ensureAuthenticated,
  controller.showIncentives
);
router.get(
  '/vouchers',
  controller.ensureAuthenticated,
  controller.showVouchers
);
router.get('/account', function (req, res, next) {
  const page = 'account/' + [req.user.uname];
  console.log(page);
  res.redirect(page);
});
router.delete(
  '/account/:uname',
  controller.ensureAuthenticated,
  controller.deleteDiner
);
router.get(
  '/account/:uname',
  controller.ensureAuthenticated,
  controller.showDinerProfile
);

module.exports = router;
