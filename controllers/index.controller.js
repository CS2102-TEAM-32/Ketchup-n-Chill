const db = require('../db/index');
const moment = require('moment');
const passport = require('passport');

exports.showHomePage = async (req, res, next) => {
  try {
    const restaurants = await db.any(
      'SELECT rname, cuisine, raddress, round(AVG(rating)) AS avg FROM ReserveTimeSlots NATURAL JOIN OwnedRestaurants GROUP BY rname, cuisine, raddress ORDER BY AVG(rating) DESC, rname LIMIT 3'
    );
    res.render('home', {
      title: 'Ketchup and Chill!',
      date: moment().format('YYYY-MM-DD'),
      restaurants: restaurants
    });
  } catch (e) {
    next(e);
  }
};

exports.getLoginPage = (req, res, next) => {
  if (req.user) { 
    // logged in already, redirect to home page!
    res.redirect('/home');
    return;
  }
  res.render('login', { title: 'Login' });
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('danger', info.message);
      return res.redirect('/login');
    }
    req.flash('success', info.message);
    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect(`/${user.type}/${user.uname}`);
    });
  })(req, res, next);
};
