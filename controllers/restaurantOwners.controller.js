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
            // view looks wrong
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
        console.log(req.params.raddress);
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
    console.log(req.body.address + "end");
    console.log(req.params.raddress + "end");
    if (!req.body.name || !req.body.address || !req.body.cuisine || !req.body.opening_hr || !req.body.closing_hr || !req.body.phone_num) {
        req.flash('danger', "Cannot leave any entry blank.");
        res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/' + req.params.raddress.replace("#","%23").replace("/", "%2F")+ '/edit');
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
                req.flash('success', "Restaurant successfully updated!");
                // render the restaurant page with the updated details. 
                //console.log(encodeURIComponent('/restaurantowners/' + req.params.uname + '/' + req.body.name + '/' + req.body.address));
                // should use encodeuricomponent for restaurant address. 
                res.redirect('/restaurantowners/' + req.params.uname + '/' + req.body.name + '/' + req.body.address.replace("#", "%23").replace("/", "%2F"));
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
            req.flash('danger', "Cannot leave any entry blank.");
            res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/' + req.params.raddress.replace("#", "%23").replace("/", "%2F") + '/edittimeslot');
        } else {
            var errors = validationResult(req);
            if (!errors.isEmpty()) {

            } else {
                var sdate = new Date(req.body.sdate);
                var edate = new Date(req.body.edate);

                var stime = moment(req.body.stime, "HH:mm");
                var etime = moment(req.body.etime, "HH:mm");
                //console.log(stime.format("HH:mm"));
                //console.log(etime.format("HH:mm"));

                var numpax = parseInt(req.body.pax, 10);
                const values = [];
                const col = new pgp.helpers.ColumnSet(['date', 'time', 'rname', 'raddress', 'num_available'], { table: 'hastimeslots' });
                //var original = 'INSERT INTO HasTimeslots (date, time, rname, raddress, num_available) VALUES ';

                for (var d = moment(sdate); d.diff(edate, 'days') <= 0; d.add(1, 'days')) {
                    //console.log(d.format('YYYY-MM-DD'));
                    //console.log(d.day());
                    if (req.body.days.includes(d.day().toString())) {
                        //console.log(d.day() + " is in the array");
                        for (var t = moment(stime, "HH:mm"); t.diff(etime, 'hours') <= 0; t.add(1, 'hours')) {
                            //console.log(t.format("HH:mm"));
                            var arr = [d.format('YYYY-MM-DD'), t.format("HH:mm"), req.params.rname, req.params.raddress, numpax];
                            const check = await db.any('SELECT 1 FROM HasTimeslots WHERE rname=$3 AND raddress=$4 AND date=$1 AND time=$2', arr);
                            if (check.length == 0) {
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
                //console.log(values);
                const query = pgp.helpers.insert(values, col);
                await db.none(query).catch(error => {
                    console.log("ERROR:", error.message || error);
                });
                req.flash('success', "Entries updated!");
                res.redirect('/restaurantowners/' + req.params.uname + '/' + req.params.rname + '/' + req.params.raddress.replace("#", "%23").replace("/", "%2F") + '/edittimeslot');
            }
        }
    } catch (e) {
        next(e);
    }
};

exports.registerRestaurantOwner = (req, res, next) => {
    res.render('registerowner', {
        title: 'Register as Restaurant Owner'
    });
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
            if (value !== req.body.pass2)
                throw new Error('Passwords do not match.');
            return value;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            errors.array().map(error => req.flash('danger', error.msg));
            return res.render('registerowner', {
                prevName: req.body.name,
                prevUname: req.body.uname
            });
        }
        return next();
    }
];

exports.createRestaurantOwner = async (req, res, next) => {
    if (!req.body.uname || !req.body.name || !req.body.pass)
        return res.sendStatus(400);
    try {
        const hash = bcrypt.hashSync(req.body.pass, bcrypt.genSaltSync(10));
        const check = await db.any('SELECT * FROM Users WHERE uname=$1', [req.body.uname]);
        if (check.length == 0) {
            await db.none('CALL add_rowner($1, $2, $3)', [
                req.body.uname,
                req.body.name,
                hash
            ]);
            req.flash('success', 'You are now registered!');
            res.redirect('/restaurantowners/' + req.body.uname);
        } else {
            req.flash('danger', 'Username exists, please use another one.');
            res.render('registerowner', {
                prevName: req.body.name,
                prevUname: req.body.uname
            });
        }
        
    } catch (e) {
        next(e);
    }
};