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

exports.showVouchers = async (req, res, next) => {
  try {
    const vouchers = db.any(
      "SELECT title, organisation, description, points, code, duname, redeemed FROM Vouchers NATURAL JOIN Incentives WHERE duname=$1 AND redeemed=FALSE",
      [req.user.uname]
    );
    const redeemedVouchers = db.any(
      "SELECT title, organisation, description, points, code, duname, redeemed FROM Vouchers NATURAL JOIN Incentives WHERE duname=$1 AND redeemed=TRUE",
      [req.user.uname]
    );
    Promise.all([vouchers, redeemedVouchers]).then(values => {
      res.render('vouchers', {
        title: 'Vouchers',
        vouchers: values[0],
        redeemedVouchers: values[1]
      });
    })
  } catch (e) {
    next(e);
  }
};

// Not complete, no route coming here yet
exports.redeemVoucher = async (req, res, next) => {
  try {
    const voucher = await db.one('SELECT * FROM Vouchers WHERE title = $1 AND organisation = $2 AND redeemed = FALSE LIMIT 1', [
      req.params.title,
      req.params.organisation
    ]);
    await db.one('UPDATE Vouchers SET duname = $1 AND redeemed = TRUE WHERE title = $2 AND organisation = $2 RETURNING *', [
      req.user.uname,
      voucher.title,
      voucher.organisation
    ]);
    res.sendStatus(JSON.stringify(voucher.code));
  } catch (e) {
    next(e);
  }
};

exports.showIncentives = async (req, res, next) => {
  try {
    const incentives = await queryDbFromReqQuery(
      "SELECT * FROM Incentives",
      req.query,
      db.any
    );
    //console.log('incentives', incentives);

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

/*
 helper function to form the query then query the db with it.
 takes in a string 'select ... from ...' as the first parameter.
 the second parameter is the req.query object.
 the last parameter is a suitable pgp method (i.e none, one, oneOrNone, many, any)
 forms the conditions in the where clause based on the keys from the req.query object,
 then forms the full sql query with the given frontPortion,
 then calls f with the query and the list of values.
 returns the promise from the method, which you then can call await on.
*/
// It's currently case sensitive and doesn't accept when organisation names are > 1 word (cuz no '') so gotta fix that!
function queryDbFromReqQuery(frontPortion, reqQuery, f) {
  const partials = {
    organisation: 'organisation = ',
    points: 'points ='
  };

  const keys = Object.keys(reqQuery);
  if (keys.length === 0) {
    // the req.query object is empty, we will query without a where clause.
    return f(frontPortion);
  }

  const conditions = keys
    .filter(key => reqQuery[key] !== '') // if they are empty, don't include in where clause
    .map((key, index) => `${partials[key]} $${index + 1}`) // pgp uses base-1 index
    .reduce((acc, curr) => `${acc} AND ${curr}`);

  //console.log('formed query:', `${frontPortion} WHERE ${conditions}`);

  // make the function call and return the promise
  return f(
    `${frontPortion} WHERE ${conditions}`,
    Object.values(reqQuery).filter(value => value !== '')
  );
}

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
      res.redirect('/login');
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
  // TODO: PROCEDURE TO DELETE!!! The following is not correct
  try {
    await db.one('DELETE FROM Diners WHERE uname=$1 RETURNING *', [
      req.user.uname
    ]);
    return res.sendStatus(200);
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

/*
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
      return res.redirect('/diners/account/' + user.uname);
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
*/
