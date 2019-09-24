var express = require('express');
var router = express.Router();
var { check, validationResult } = require('express-validator');
var passport = require('passport');

var controller = require('../controllers/diners.controller');

router.get('/', controller.showAllDiners);
router.get('/register', controller.registerDiner);
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
    if (!errors.isEmpty()) {
      errors.array().map(error => req.flash('danger', error.msg));
      return res.render('register');
    }
    return next();
  },
  controller.createDiner
);
router.get('/login', controller.loginDiner);
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    console.log(info);
    if (!user) {
      req.flash('danger', info.message);
      return res.redirect('/diners/login');
    }
    req.flash('success', info.message);
    res.redirect('/diners/' + req.body.username);
  })(req, res, next);
});

router.delete('/:username', controller.deleteDiner);
router.get('/:username', controller.showDinerParticulars);

module.exports = router;
