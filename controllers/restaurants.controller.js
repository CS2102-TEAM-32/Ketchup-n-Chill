const db = require('../db/index');
const moment = require('moment');
/* show all restaurants or selected restaurants based on req.query */
exports.showRestaurants = async (req, res, next) => {
  try {
    let restaurants;
    if (Object.entries(req.query).length === 0) { // no query
      restaurants = await db.many('SELECT DISTINCT rname, raddress, cuisine FROM OwnedRestaurants ORDER BY rname');
    } else {
      restaurants = await queryDbFromReqQuery(
        'SELECT DISTINCT rname, raddress, cuisine FROM OwnedRestaurants NATURAL JOIN HasTimeslots',
        req.query,
        db.any
      );
    }

    res.render('restaurants', {
      title: 'Restaurants',
      restaurants: restaurants
    });
  } catch (e) {
    next(e);
  }
};

exports.addRestaurant = async (req, res, next) => {
    var unacceptable = /^[_A-z0-9]*((-|\s|,|')*[_A-z0-9])*$/;
    
    if (
        !req.body.name ||
        !req.body.address ||
        !req.body.cuisine ||
        !req.body.opening_hr ||
        !req.body.closing_hr ||
        !req.body.phone_num
    ) {
        req.flash('danger', 'Fields must not be blank!');
        res.redirect('/restaurants/add');
    } else if (req.body.name.match(unacceptable) == null  || req.body.cuisine.match(unacceptable) == null || req.body.phone_num.match(unacceptable) == null) {
        req.flash('danger', "Name, cuisine and phone number cannot contain any unacceptable characters such as: ;,\/ ?:@&=+$#");
        res.redirect('/restaurants/add');
    } else if ((moment(req.body.opening_hr, "HH:mm")).isSameOrAfter(moment(req.body.closing_hr, "HH:mm"))) {
        req.flash('danger', 'Closing hours must be after opening hours!');
        res.redirect('/restaurants/add');
    } else {

        try {
            await db.one('INSERT INTO OwnedRestaurants VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [
                req.user.uname,
                req.body.address,
                req.body.name,
                req.body.cuisine,
                req.body.phone_num,
                req.body.opening_hr,
                req.body.closing_hr
            ]);

            // no errors thrown
            req.flash('success', 'Your restaurant has been added!');
            return res.redirect('/home');
        } catch (e) {
            // errors thrown
            // insert failed due to duplicate primary keys...
            console.log(e);
            req.flash('danger', 'Something went wrong; please try again. Perhaps your restaurant has been registered already?');
            return res.redirect('/restaurants/add');
        }
    }
};

exports.showRestaurantAddPage = async (req, res, next) => {
  res.render('restaurantowners-add-restaurant');
}

exports.showRestaurantProfile = async (req, res, next) => {
  try {
    const restaurant = db.one(
      'SELECT * FROM OwnedRestaurants WHERE rname=$1 AND raddress=$2',
      [req.params.rname, req.params.raddress],
    );
    const reviews = db.any(
      "SELECT rating, review, r_date, to_char(r_date, 'DD MON YYYY') AS date, r_time, to_char(r_time, 'HH12.MIPM') AS time FROM ReserveTimeslots WHERE rname=$1 AND raddress=$2 AND ((rating IS NOT NULL) OR (review IS NOT NULL)) ORDER BY r_date ASC, r_time ASC LIMIT 3",
        [req.params.rname, req.params.raddress],
      );
    Promise.all([restaurant, reviews]).then(values => {
      res.render('restaurant', {
        userIsDiner: req.user,
        restName: values[0].rname,
        restAddr: values[0].raddress,
        restaurantOwner: values[0].uname,
        phoneNum: values[0].phone_num,
        cuis: values[0].cuisine,
        openinghr: values[0].opening_hr,
        closinghr: values[0].closing_hr,
        reviews: values[1]
      });
    });
  } catch (e) {
    next(e);
  }
};

exports.showRestaurantTimeslot = async (req, res, next) => {
    console.log(req.params);
    try {
        const timeslotDates = await db.any(
            'SELECT DISTINCT date FROM HasTimeslots WHERE rname=$1 AND raddress =$2 ORDER BY date',
            [req.params.rname, req.params.raddress]
        );
        const timeslotList = await db.any(
            'SELECT * FROM HasTimeslots WHERE rname=$1 AND raddress =$2',
            [req.params.rname, req.params.raddress]
        );

        var dateNow = moment().format("YYYY-MM-DD");
        console.log(dateNow);

        var length = timeslotDates.length;
        var count = 0;
        while (count < length) {
            var currDate = timeslotDates[count].date; 
            if (moment(dateNow).isAfter(moment(currDate))) {
                timeslotDates.splice(count, 1);
            }
            count += 1;
        }
        console.log(timeslotDates.length);

        return res.render('timeslots', {
            timeslotDict: timeslotList,
            timeslotDates: timeslotDates,
            restName: req.params.rname,
            restAddress: req.params.raddress
        });
    } catch (e) {
        return res.redirect('/restaurants/' + req.params.rname + '/' + req.params(raddress));
    }
};

exports.showRestaurantMenus = async (req, res, next) => {
  try {
    // check if restaurant exists
    await db.one(
      'SELECT * FROM OwnedRestaurants WHERE rname=$1 AND raddress=$2',
      [req.params.rname, req.params.raddress]
    );
    const menus = await db.any(
      'SELECT * FROM Menu NATURAL JOIN OwnedRestaurants WHERE rname=$1 AND raddress=$2',
      [req.params.rname, req.params.raddress]
    );

    return res.render('restaurant-menus', {
      restaurant: req.params,
      menus
    });
  } catch (e) {
    return res.sendStatus(404);
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
function queryDbFromReqQuery(frontPortion, reqQuery, f) {
  const partials = {
    date: 'date =',
    time: 'time =',
    pax: 'num_available >=', // help!
    cuisine: 'cuisine =',
    rname: 'rname ='
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

  // console.log('formed query:', `${frontPortion} WHERE ${conditions}`);

  // make the function call and return the promise
  return f(
    `${frontPortion} WHERE ${conditions}`,
    Object.values(reqQuery).filter(value => value !== '')
  );
}

exports.bookRestaurant = async (req, res, next) => {
  try {
    //console.log(req.body);
    //console.log(req.query);
    // date, time, rname, raddress, duname, review, rating, num_diners
    var dateNow = Date.now();
    var bookingDate = req.query.date;
    var dateNowFormat = moment(dateNow).format("YYYY-MM-DD");
    var bookingDateFormat = moment(bookingDate).format("YYYY-MM-DD");
    console.log("Today's date is " + dateNowFormat);
    console.log("Booking date is " + bookingDateFormat);
    if (bookingDateFormat < dateNowFormat) {
      // Reject booking if booking date already passed
      res.json(3);
      return;
    }

    var numPax = req.query.pax;
    if (numPax <= 0) {
      res.json(5);
      return;
    }

    const update = await db.oneOrNone('INSERT INTO ReserveTimeslots VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [
      req.query.date,
      req.query.time,
      req.query.rname,
      req.query.raddr,
      req.user.uname,
      null,
      null,
      req.query.pax
    ]);
    console.log(update);
    if (update != null) {
      // If successful, then give confirmation message
      res.json(1);
    } else {
      // Not successful, either because timeslot does not exist or num_available maxed
      res.json(0);
    }
  } catch (e) {
    console.log(e);
    if (e.code == '23505') {
      // Duplicate slots booked, give error message. Reject booking
      res.json(4);
    }
    // No paramaters passed in.
    res.json(2);
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
function queryDbFromReqQueryForBooking(frontPortion, reqQuery, f) {
  const partials = {
    date: 'date =',
    time: 'time =',
    //pax: 'pax =',
    rname: 'rname =',
    raddr: 'raddress ='
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

  // console.log('formed query:', `${frontPortion} WHERE ${conditions}`);

  // make the function call and return the promise
  return f(
    `${frontPortion} WHERE ${conditions} LIMIT 1`,
    Object.values(reqQuery).filter(value => value !== '')
  );
}