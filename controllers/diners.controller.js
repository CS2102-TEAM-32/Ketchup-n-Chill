const db = require('../db/index');

var bcrypt = require('bcryptjs');
var { check, validationResult } = require('express-validator');
var passport = require('passport');

exports.showAllDiners = async (req, res, next) => {
  try {
    const diners = await db.any('SELECT * FROM Diners');
    res.render('diners', {
      title: 'Diners',
      diners: diners
    });
  } catch (e) {
    next(e);
  }
};

exports.showDinerProfile = async (req, res, next) => {
  try {
    const diner = await db.one('SELECT * FROM Diners WHERE uname=$1', [
      req.params.uname
    ]);
    var points = await db.one(
      'SELECT COUNT(*) FROM ReserveTimeslots WHERE duname=$1',
      [req.params.uname]
    );
    res.render('diner', {
      title: diner.uname,
      diner: diner,
      points: points
    });
  } catch (e) {
    next(e);
  }
};

exports.registerDiner = (req, res, next) => {
  res.render('register', {
    title: 'Register'
  });
};

exports.getLoginPage = (req, res, next) => {
  res.render('login', {
    title: 'Login'
  });
};

exports.createDiner = async (req, res, next) => {
  if (!req.body.uname || !req.body.name || !req.body.pass)
    return res.sendStatus(400);
  try {
    const hash = bcrypt.hashSync(req.body.pass, bcrypt.genSaltSync(10));
    await db.none('CALL add_diner($1, $2, $3)', [
      req.body.uname,
      req.body.name,
      hash
    ]);
    req.flash('success', 'You are now registered!');
    res.redirect('/diners/' + req.body.uname);
  } catch (e) {
    next(e);
  }
};

exports.deleteDiner = async (req, res, next) => {
  try {
    await db.one('DELETE FROM Diners WHERE uname=$1 RETURNING *', [
      req.params.uname
    ]);
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};

exports.registerValidations = [
  check('name', 'Name must not be empty.')
    .not()
    .isEmpty(),
  check('uname', 'uname must be at least 5 characters.').isLength({
    min: 5
  }),
  check('pass', 'pass must be at least 8 characters.')
    .isLength({ min: 8 })
    .custom((value, { req }) => {
      if (value !== req.body.pass2)
        throw new Error('passs do not match.');
      return value;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().map(error => req.flash('danger', error.msg));
      return res.render('register');
    }
    return next();
  }
];

exports.logDinerIn = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('danger', info.message);
      return res.redirect('/diners/login');
    }
    req.flash('success', info.message);
    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect('/diners/' + user.uname);
    });
  })(req, res, next);
};

exports.logDinerOut = (req, res, next) => {
  req.logout();
  req.flash('success', 'You have succesfully logged out.');
  res.redirect('/diners/login');
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('danger', 'Please login');
  res.redirect('/diners/login');
};
