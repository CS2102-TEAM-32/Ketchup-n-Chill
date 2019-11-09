const db = require('../db/index');
const moment = require('moment');

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

exports.ensureAuthenticatedAny = (req, res, next) => {
  if (req.isAuthenticated) {
    return next();
  }
  req.flash('danger', 'Please login');
  res.redirect('/login');
}

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

exports.showHomePage = (req, res, next) => {
  console.log(req.user);
  if (req.user && req.user.type === 'restaurantOwner') {
    return showRestaurantOwnerHomePage(req, res, next);
  }
  // not logged in or diner
  return showGenericHomePage(req, res, next);
}

exports.showProfile = (req, res, next) => {
  const type = req.user.type;
  if (type === 'diner') {
    return showDinerProfile(req, res, next);
  } else if (type === 'restaurantOwner') {
    // showRestaurantOwnerProfile ...
    return res.redirect('/home');
    return;
  } else {
    return next();
  }
}

showDinerProfile = async (req, res, next) => {
  try {
    const diner = db.one('SELECT * FROM Diners NATURAL JOIN Users WHERE uname=$1', [
      req.user.uname
    ]);
    const points = calculatePoints(req.user.uname);
    const mostVisited = db.any(
      'SELECT rname, raddress FROM ReserveTimeslots WHERE duname=$1 GROUP BY rname, raddress ORDER BY count(*) DESC LIMIT 3',
        [req.user.uname]
    );
    const reviews = db.any(
      'SELECT rname, rating, review FROM ReserveTimeslots WHERE duname=$1 AND is_complete = TRUE AND (review IS NOT NULL OR rating IS NOT NULL) ORDER BY r_date DESC, r_time DESC LIMIT 3',
        [req.user.uname]
    );
    const history = db.any(
      "SELECT r_date, to_char(r_date, 'DD MON YYYY') AS date, r_time, to_char(r_time, 'HH12.MIPM') AS time, rname, raddress FROM ReserveTimeslots WHERE duname=$1 AND is_complete = TRUE ORDER BY r_date DESC, r_time DESC LIMIT 3",
        [req.user.uname]
    );
    Promise.all([diner, points, mostVisited, reviews, history]).then(values => {
    console.log(reviews);
      res.render('diner', {
        title: values[0].uname,
        diner: values[0],
        points: values[1],
        visited: values[2],
        reviews: values[3],
        history: values[4]
      });
    })
  } catch (e) {
    next(e);
  }
};

showRestaurantOwnerHomePage = async (req, res, next) => {
    try {
        const topRestaurants = await db.any('SELECT rname, cuisine, raddress, round(AVG(rating)) AS avg FROM ReserveTimeSlots NATURAL JOIN OwnedRestaurants WHERE uname=$1 AND (rating IS NOT NULL) GROUP BY rname, cuisine, raddress ORDER BY AVG(rating) DESC, rname LIMIT 3', [req.user.uname]);
        const allRestaurants = await db.any('SELECT * FROM OwnedRestaurants WHERE uname=$1', [req.user.uname]);
        res.render('restaurantowners', {
            title: 'Welcome ' + [req.user.uname] +'!',
            topRestaurants: topRestaurants,
            allRestaurants: allRestaurants
        });
    } catch (e) {
        next(e);
    }
};

showGenericHomePage = async (req, res, next) => {
  try {
    const restaurants = await db.any(
      'SELECT rname, cuisine, raddress, round(AVG(rating)) AS avg FROM ReserveTimeSlots NATURAL JOIN OwnedRestaurants WHERE (rating IS NOT NULL) GROUP BY rname, cuisine, raddress ORDER BY AVG(rating) DESC, rname LIMIT 3'
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

async function calculatePoints(uname) {
  const points = db.one(
    'SELECT COUNT(*) FROM ReserveTimeslots WHERE duname=$1 AND is_complete = TRUE',
    [uname]
  );
  const existingVouchers = db.one(
    "SELECT SUM(points) FROM Vouchers NATURAL JOIN Incentives WHERE duname=$1",
    [uname]
  );
  return Promise.all([points, existingVouchers]).then(values => {
    return values[0].count - values[1].sum;
  });
}