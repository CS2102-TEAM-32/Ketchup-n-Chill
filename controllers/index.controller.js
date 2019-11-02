const db = require('../db/index');
const moment = require('moment');
const passport = require('passport');

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
