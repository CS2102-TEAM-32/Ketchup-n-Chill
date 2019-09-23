var express = require('express');
var router = express.Router();

var controller = require('../controllers/diners.controller');

router.get('/', controller.showAllDiners);
router.get('/:username', controller.showDinerParticulars);

module.exports = router;
