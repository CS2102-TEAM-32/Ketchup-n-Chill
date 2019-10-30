const db = require('../db/index');
const pgp = require('pg-promise')({
    capSQL: true
});

var bcrypt = require('bcryptjs');
var { check, validationResult } = require('express-validator');
var passport = require('passport');
const moment = require('moment');

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
        const restaurantDetails = await db.one('SELECT * FROM OwnedRestaurants WHERE uname=$1 AND rname=$2 AND raddress=$3', [req.params.uname, req.params.rname, req.params.raddress]);
        const timeslots = await db.any('SELECT * FROM HasTimeslots WHERE rname=$1 AND raddress=$2 ORDER BY date DESC, time', [req.params.rname, req.params.raddress]);
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
    try {
        const restaurantDetails = await db.one('SELECT * FROM OwnedRestaurants WHERE uname=$1 AND rname=$2 AND raddress=$3', [req.params.uname, req.params.rname, req.params.raddress]);
        res.render('restaurantownersrestauranteditinfo', {
            title: 'Edit ' + [req.params.rname],
            details: restaurantDetails
        });
    } catch (e) {
        next(e);
    }
};

exports.editTimeslots = async (req, res, next) => {
    try {
        const timeslots = await db.any('SELECT * FROM OwnedRestaurants NATURAL JOIN HasTimeslots WHERE uname=$1 AND rname=$2 AND raddress=$3', [req.params.uname, req.params.rname, req.params.raddress]);
        res.render('restaurantownersrestaurantedittimeslot', {
            title: 'Edit timeslots for ' + [req.params.rname],
            timeslots: timeslots,
            date: moment().format('YYYY-MM-DD'),
            values: { uname : req.params.uname, rname: req.params.rname, raddress: req.params.raddress }
        });
    } catch (e) {
        next(e);
    }
};

exports.updateRestaurant = async (req, res, next) => {
    console.log(req.params.raddress + "end");
    if (!req.body.name || !req.body.address || !req.body.cuisine || !req.body.opening_hr || !req.body.closing_hr || !req.body.phone_num) {
        req.flash("Cannot leave any entry blank.");
        res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/' + req.params.raddress.replace("#","%23") + '/edit');
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
                res.redirect('/restaurantowners/' + req.params.uname + '/' + req.body.name + '/' + req.body.address.replace("#", "%23"));
            }

        } catch (e) {
            next(e);
        }
    }
};

exports.updateTimeslot = async (req, res, next) => {
    try {
        console.log(req.body);
        if (!req.body.sdate || !req.body.edate || !req.body.stime || !req.body.etime || !req.body.pax || !req.body.days) {
            req.flash("Cannot leave any entry blank.");
            res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/' + req.params.raddress.replace("#", "%23") + '/edittimeslot');
        } else {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {

            } else {
                var sdate = new Date(req.body.sdate);
                var edate = new Date(req.body.edate);

                var stime = moment(req.body.stime, "HH:mm");
                var etime = moment(req.body.etime, "HH:mm");
                console.log(stime.format("HH:mm"));
                console.log(etime.format("HH:mm"));

                /*for (var d = sdate; d <= edate; d.setDate(d.getDate() + 1)) {
                    console.log(new Date(d));
                    /*for (var t = stime; t <= etime; t = t + 60) {
                        console.log(d + " " + t);
                    }
                }*/

                var numpax = parseInt(req.body.pax, 10);
                const values = [];
                const col = new pgp.helpers.ColumnSet(['date', 'time', 'rname', 'raddress', 'num_available'], { table: 'hastimeslots' });
                //var original = 'INSERT INTO HasTimeslots (date, time, rname, raddress, num_available) VALUES ';

                for (var d = moment(sdate); d.diff(edate, 'days') <= 0; d.add(1, 'days')) {
                    console.log(d.format('YYYY-MM-DD'));
                    console.log(d.day());
                    if (req.body.days.includes(d.day().toString())) {
                        console.log(d.day() + " is in the array");
                        for (var t = moment(stime, "HH:mm"); t.diff(etime, 'hours') <= 0; t.add(1, 'hours')) {
                            console.log(t.format("HH:mm"));
                            var arr = [d.format('YYYY-MM-DD'), t.format("HH:mm"), req.params.rname, req.params.raddress, numpax];
                            const check = await db.any('SELECT 1 FROM HasTimeslots WHERE rname=$3 AND raddress=$4 AND date=$1 AND time=$2', arr);
                            console.log(check);
                            if (check.length == 0) {
                                console.log("check is not 0");
                                var temp = { date: d.format('YYYY-MM-DD'), time: t.format("HH:mm"), rname: req.params.rname, raddress: req.params.raddress, num_available: numpax };
                                values.push(temp);
                            }
                            //db.none('INSERT INTO HasTimeslots (date, time, rname, raddress, num_available) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (rname, raddress, date, time) DO NOTHING', arr);
                            //original = original + '(' + d.format('YYYY-MM-DD') + ', ' + t.format("HH:mm") + ', ' + req.params.rname + ', ' + req.params.raddress + ', ' + req.body.pax + ')';
                            //if (t.diff(etime, 'hours') < 0) {
                             //   original = original + ',';
                            //}
                        }
                    }  
                }
                //console.log(original);
                console.log(values);
                const query = pgp.helpers.insert(values, col);
                await db.none(query).catch(error => {
                    console.log("ERROR:", error.message || error);
                });
                //await db.none(original + '("2019-12-30", "09:30", "Popeyes", "229 Victoria St, Singapore 188023", 1');
                //await db.none(original);
                res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/' + req.params.raddress.replace("#", "%23") + '/edittimeslot');
            }
        }
    } catch (e) {
        console.log("error:", error.messsage);
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