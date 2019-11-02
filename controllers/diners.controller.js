const db = require('../db/index');

var bcrypt = require('bcryptjs');
var { check, validationResult } = require('express-validator');
var passport = require('passport');

exports.showReservations = async (req, res, next) => {
  try {
    const reservations = db.any(
      "SELECT duname, r_date, to_char(r_date, 'DD MON YYYY') AS date, r_time, to_char(r_time, 'HH12.MIPM') AS time, rname, raddress, review, rating, num_diners, is_complete FROM ReserveTimeslots WHERE duname=$1 AND r_date < current_date OR (r_date = current_date AND r_time >= current_time) ORDER BY r_date DESC, r_time DESC",
      [req.user.uname]
    );
    const upcoming = db.any(
      "SELECT duname, r_date, to_char(r_date, 'DD MON YYYY') AS date, r_time, to_char(r_time, 'HH12.MIPM') AS time, rname, raddress, review, rating, num_diners, is_complete FROM ReserveTimeslots WHERE duname=$1 AND r_date > current_date OR (r_date = current_date AND r_time < current_time) ORDER BY r_date DESC, r_time DESC",
      [req.user.uname]
    );
    const duname = req.user.uname;
    Promise.all([reservations, upcoming, duname]).then(values => {
      res.render('reservations', {
        title: 'Reservations',
        reservations: values[0],
        upcoming: values[1],
        duname: values[2]
      });
    });
  } catch (e) {
    next(e);
  }
};

exports.showIncentives = async (req, res, next) => {
  try {
    const incentives = db.any('SELECT * FROM Incentives');
    const points = db.one(
      'SELECT COUNT(*) FROM ReserveTimeslots WHERE duname=$1',
      [req.user.uname]
    );
    const name = db.one('SELECT name FROM Users WHERE uname=$1', [
      req.user.uname
    ]);
    Promise.all([incentives, points, name]).then(values => {
      res.render('incentives', {
        title: 'Incentives',
        incentives: values[0],
        points: values[1].count,
        name: values[2].name
      });
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
    const check = await db.any('SELECT * FROM Users WHERE uname=$1', [
      req.body.uname
    ]);
    if (check.length == 0) {
      await db.none('CALL add_diner($1, $2, $3)', [
        req.body.uname,
        req.body.name,
        hash
      ]);
      req.flash('success', 'You are now registered!');
      res.redirect('/restaurantowners/' + req.body.uname);
    } else {
      req.flash('danger', 'Username exists, please use another one.');
      res.render('register', {
        prevName: req.body.name,
        prevUname: req.body.uname
      });
    }
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
  check('uname', 'Username must be at least 5 characters.').isLength({
    min: 5
  }),
  check('pass', 'Password must be at least 8 characters.')
    .isLength({ min: 8 })
    .custom((value, { req }) => {
      if (value !== req.body.pass2) throw new Error('Passwords do not match.');
      return value;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().map(error => req.flash('danger', error.msg));
      return res.render('register', {
        prevName: req.body.name,
        prevUname: req.body.uname
      });
    }
    return next();
  }
];
