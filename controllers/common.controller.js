var passport = require('passport');

exports.ensureAuthenticatedDiner = (req, res, next) => {
  if (req.user && req.user.type === 'diner') {
    return next();
  }
  req.flash('danger', 'Please login');
  res.redirect('/login');
};

exports.ensureAuthenticatedRestaurantOwner = (req, res, next) => {
  console.log(req.user);
  if (req.user && req.user.type === 'restaurantOwner') {
    return next();
  }
  req.flash('danger', 'Please login');
  res.redirect('/login');
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('danger', info.message);
      return res.redirect(`/login`);
    }
    req.flash('success', info.message);
    req.logIn(user, err => {
      if (err) return next(err);
      return res.redirect(`/home`);
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout();
  req.flash('success', 'You have successfully logged out.');
  res.redirect('/home');
}
