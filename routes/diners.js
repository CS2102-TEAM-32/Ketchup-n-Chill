var express = require('express');
var router = express.Router();

var controller = require('../controllers/diners.controller');

router.get('/', controller.showAllDiners);
router.get('/register', controller.registerDiner);
router.post(
  '/register',
  controller.registerValidations,
  controller.createDiner
);
router.get('/login', controller.getLoginPage);
router.post('/login', controller.logDinerIn);
router.get('/logout', controller.logDinerOut);
router.delete('/:username', controller.deleteDiner);
router.get('/:username', controller.showDinerParticulars);

module.exports = router;
