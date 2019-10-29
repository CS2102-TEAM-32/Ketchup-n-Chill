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

exports.showRestaurant = async (req, res, next) => {
    try {
        // need to query the address also hmz. 
        console.log("goes to show res instead");
        const restaurantDetails = await db.one('SELECT * FROM OwnedRestaurants WHERE uname=$1 AND rname=$2', [req.params.uname, req.params.rname]);
        const timeslots = await db.any('SELECT * FROM HasTimeslots WHERE rname=$1 ORDER BY date DESC, time', [req.params.rname]);
        res.render('restaurantownersrestaurant', {
            title: [req.params.uname] + "'s " + [req.params.rname],
            details: restaurantDetails,
            timeslots: timeslots
        });
    } catch (e) {
        next(e);
    }
};


exports.editRestaurant = async (req, res, next) => {
    // not the most efficient way to query again, will think of a better way to pass information around.
    try {
        const restaurantDetails = await db.one('SELECT * FROM OwnedRestaurants WHERE uname=$1 AND rname=$2', [req.params.uname, req.params.rname]);
        res.render('restaurantownersrestauranteditinfo', {
            title: 'Edit ' + [req.params.rname],
            details: restaurantDetails
        });
    } catch (e) {
        next(e);
    }
};

exports.updateRestaurant = async (req, res, next) => {
    if (!req.body.name || !req.body.address || !req.body.cuisine || !req.body.opening_hr || !req.body.closing_hr || !req.body.phone_num) {
        req.flash("Cannot leave any entry blank.");
        res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/edit');
    } else {
        try {
            // need to check for validity of the requests 
            /*req.assert('name', 'Name is required').notEmpty();
            req.assert('address', 'Address is required').notEmpty();
            req.assert('cuisine', 'Cuisine is required').notEmpty();
            req.assert('opening_hr', 'Opening hour is required').notEmpty();
            req.assert('closing_hr', 'Closing hour is required').notEmpty();
            req.assert('phone_num', 'Phone number is required').notEmpty();*/

            /*req.santize('name').trim().escape();
            req.sanitize('address').trim().escape();
            req.sanitize('cuisine').trim().escape();
            req.sanitize('opening_hr').toDate();
            req.sanitize('closing_hr').toDate();
            req.sanitize('phone_num').trim().escape();*/

            var errors = validationResult(req);

            if (!errors.isEmpty()) {
                var error_msg = ''
                errors.forEach(function (error) {
                    error_msg += error.msg + '<br>'
                })
                req.flash('error', error_msg);

                /**
                * Using req.body.name
                * because req.param('name') is deprecated
                */

                const restaurantDetails = await db.one('SELECT * FROM OwnedRestaurants WHERE uname=$1 AND rname=$2', [req.params.uname, req.params.rname]);
                res.render('restaurantownersrestauranteditinfo', {
                    title: 'Edit ' + [req.params.rname],
                    details: restaurantDetails
                });
            } else {
                var temp = [req.body.name, req.body.address, req.body.cuisine,
                req.body.opening_hr, req.body.closing_hr, req.body.phone_num, req.params.uname, req.params.rname];
                await db.none('UPDATE OwnedRestaurants SET rname=$1, raddress=$2, cuisine=$3, opening_hr=$4, closing_hr=$5, phone_num=$6 WHERE uname=$7 AND rname=$8', temp);
                req.flash("Restaurant successfully updated!");
                // render the restaurant page with the updated details. 
                res.redirect('/restaurantowners/' + req.params.uname + '/' + req.body.name);
            }

        } catch (e) {
            next(e);
        }
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