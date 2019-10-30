var express = require('express');
var router = express.Router();

var controller = require('../controllers/restaurantOwners.controller');

//router.get('/', function (req, res, next) {
  //  res.redirect('/restaurantowners');
//});

router.get('/', controller.showHomePage);

router.get(
    '/:uname',
    controller.showHomePage
);

router.post('/:uname/:rname/:raddress', controller.updateRestaurant);

router.get(
    '/:uname/:rname/:raddress',
    controller.showRestaurant
);


router.get(
    '/:uname/:rname/:raddress/edit',
    controller.editRestaurant
);

router.get(
    '/:uname/:rname/:raddress/edittimeslot',
    controller.editTimeslots
);

router.post('/:uname/:rname/:raddress/updatetimeslot', controller.updateTimeslot);

module.exports = router;