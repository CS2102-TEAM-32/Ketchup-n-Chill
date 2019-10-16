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
    const diner = await db.one('SELECT * FROM Diners WHERE username=$1', [
      req.params.username
    ]);
    var points = await db.one('SELECT COUNT(*) FROM ReserveTimeslot WHERE did=$1', [
        req.params.username
    ]);
    res.render('diner', {
      title: diner.username,
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
  if (!req.body.username || !req.body.name || !req.body.password)
    return res.sendStatus(400);
  try {
    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    const diner = await db.one(
      'INSERT INTO Diners (name, username, password) VALUES ($1, $2, $3) RETURNING *',
      [req.body.name, req.body.username, hash]
    );
    req.flash('success', 'You are now registered!');
    res.redirect('/diners/' + diner.username);
  } catch (e) {
    next(e);
  }
};

exports.deleteDiner = async (req, res, next) => {
  try {
    await db.one('DELETE FROM Diners WHERE username=$1 RETURNING *', [
      req.params.username
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
  check('username', 'Username must be at least 5 characters.').isLength({
    min: 5
  }),
  check('password', 'Password must be at least 8 characters.')
    .isLength({ min: 8 })
    .custom((value, { req }) => {
      if (value !== req.body.password2)
        throw new Error('Passwords do not match.');
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
      return res.redirect('/diners/' + user.username);
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