const db = require('../db/index');

var bcrypt = require('bcryptjs');
var { check, validationResult } = require('express-validator');
var passport = require('passport');

exports.showHomePage = async (req, res, next) => {
    try {
        const topRestaurants = await db.any('SELECT rname, cuisine, raddress, round(AVG(rating)) AS avg FROM ReserveTimeSlots NATURAL JOIN OwnedRestaurants WHERE uname=$1 GROUP BY rname, cuisine, raddress ORDER BY AVG(rating) DESC, rname LIMIT 3', [req.params.uname]);
        const allRestaurants = await db.any('SELECT * FROM OwnedRestaurants WHERE uname=$1', [req.params.uname]);
        res.render('restaurantowners', {
            title: 'Welcome ' + [req.params.uname] +'!',
            topRestaurants: topRestaurants,
            allRestaurants: allRestaurants
        });
    } catch (e) {
        next(e);
    }
};
// need to do the authentication, to do together with wailun... 


// this is abit wrong, need to check with wailun how to change this.
// cause passport authenticate users the db of diners instead of users.
/*exports.logRestaurantOwnerIn = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('danger', info.message);
            return res.redirect('/restaurantowners/login');
        }
        req.flash('success', info.message);
        req.logIn(user, err => {
            if (err) return next(err);
            return res.redirect('/restaurantowners/' + user.uname);
        });
    })(req, res, next);
};

// this is also abit wrong, need to check with wailun how to do this.
exports.logDinerOut = (req, res, next) => {
    req.logout();
    req.flash('success', 'You have succesfully logged out.');
    res.redirect('/restaurantowners/login');
};

exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenthicated()) {
        return next();
    }
    req.flash('danger', 'Please login');
    res.redirect('/restaurantowners/login');
}; */
