var express = require('express');
var router = express.Router();
var { check, validationResult } = require('express-validator');

var controller = require('../controllers/diners.controller');

router.get('/', controller.showAllDiners);
router.get('/register', controller.registerDiner);
router.get('/:username', controller.showDinerParticulars);
router.post(
  '/register',
  [
    check('name', 'Name must not be empty.')
      .not()
      .isEmpty(),
    check('username', 'Username must be at least 5 characters.').isLength({
      min: 5
    }),
    check('password', 'Password must be at least 8 characters.')
      .isLength({ min: 8 })
      .custom((value, { req }) => {
        if (value !== req.body.password2)
          throw new Error('Passwords do not match.');
        return value;
      })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.render('register', { errors: errors.array() });
    return next();
  },
  controller.createDiner
);
router.delete('/:username', controller.deleteDiner);

module.exports = router;
