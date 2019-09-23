var express = require('express');
var router = express.Router();

var controller = require('../controllers/diners.controller');

router.get('/', controller.showAllDiners);
router.get('/register', controller.registerDiner);
router.get('/:username', controller.showDinerParticulars);
router.post('/', controller.createDiner);
router.delete('/:username', controller.deleteDiner);

module.exports = router;
