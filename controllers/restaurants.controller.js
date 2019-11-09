const db = require('../db/index');
const moment = require('moment');
/* show all restaurants or selected restaurants based on req.query */
exports.showRestaurants = async (req, res, next) => {
  try {
    let restaurants;
    if (Object.entries(req.query).length === 0) {
      // no query
      restaurants = await db.many(
        'SELECT DISTINCT rname, raddress, cuisine FROM OwnedRestaurants ORDER BY rname'
      );
    } else {
      // restaurants = await queryDbFromReqQuery(
      //   'SELECT DISTINCT rname, raddress, cuisine FROM OwnedRestaurants NATURAL JOIN HasTimeslots',
      //   req.query,
      //   db.any
      // );
      restaurants = await makeSearchQuery(req.query, db.any);
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
  }

  try {
    await db.one(
      'INSERT INTO OwnedRestaurants VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        req.user.uname,
        req.body.address,
        req.body.name,
        req.body.cuisine,
        req.body.phone_num,
        req.body.opening_hr,
        req.body.closing_hr
      ]
    );

    // no errors thrown
    req.flash('success', 'Your restaurant has been added!');
    return res.redirect('/home');
  } catch (e) {
    // errors thrown
    // insert failed due to duplicate primary keys...
    console.log(e);
    req.flash(
      'danger',
      'Something went wrong; please try again. Perhaps your restaurant has been registered already?'
    );
    return res.redirect('/restaurants/add');
  }
};

exports.showRestaurantAddPage = async (req, res, next) => {
  res.render('restaurantowners-add-restaurant');
};

exports.showRestaurantProfile = async (req, res, next) => {
  console.log(req.params);
  try {
    const restaurant = await db.one(
      'SELECT * FROM OwnedRestaurants WHERE rname=$1 AND raddress=$2',
      [req.params.rname, req.params.raddress]
    );

    res.render('restaurant', {
      userIsDiner: req.user,
      restName: restaurant.rname,
      restAddr: restaurant.raddress,
      restaurantOwner: restaurant.uname,
      phoneNum: restaurant.phone_num,
      cuis: restaurant.cuisine,
      openinghr: restaurant.opening_hr,
      closinghr: restaurant.closing_hr
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

    return res.render('timeslots', {
      timeslotDict: timeslotList,
      timeslotDates: timeslotDates,
      restName: req.params.rname,
      restAddress: req.params.raddress
    });
  } catch (e) {
    return res.redirect(
      '/restaurants/' + req.params.rname + '/' + req.params(raddress)
    );
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

function makeSearchQuery(reqQuery, f) {
  const partials = {
    date: 'date =',
    time: 'time =',
    cuisine: 'upper(cuisine) LIKE',
    rname: 'upper(rname) LIKE'
  };

  const keys = Object.keys(reqQuery);
  const usedKeys = Object.keys(reqQuery).filter(
    key => key !== 'pax' && reqQuery[key] !== '' // don't include in the WHERE clause if empty OR it is pax
  );
  const conditions = usedKeys
    .map((key, index) => `${partials[key]} $${index + 1}`) // pgp uses base-1 index
    .reduce((acc, curr) => `${acc} AND ${curr}`);

  const cte1 = `(SELECT DISTINCT rname, raddress, cuisine, num_available FROM OwnedRestaurants NATURAL JOIN HasTimeslots WHERE ${conditions})`;

  const cte2 = `(SELECT COALESCE (SUM(num_diners), 0), rname, raddress FROM CTE_1 NATURAL LEFT JOIN ReserveTimeslots GROUP BY rname, raddress)`;

  const remaining = `SELECT DISTINCT rname, raddress, cuisine FROM CTE_1 NATURAL LEFT JOIN CTE_2 WHERE (num_available - coalesce - $${usedKeys.length +
    1}) >= 0`;

  const pgpArray = Object.keys(reqQuery)
    .filter(key => reqQuery[key] !== '' && key !== 'pax')
    .map(key => reqQuery[key]);
  pgpArray.push(reqQuery.pax || 1);

  const final = `WITH CTE_1 AS ${cte1}, CTE_2 AS ${cte2} ${remaining}`;

  console.log(final);
  console.log(pgpArray);

  return f(final, pgpArray);
}

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

  console.log(reqQuery);

  const keys = Object.keys(reqQuery);
  if (keys.length === 0) {
    // the req.query object is empty, we will query without a where clause.
    return f(frontPortion);
  }

  const conditions = keys
    .filter(key => reqQuery[key] !== '') // if they are empty, don't include in where clause
    .map((key, index) => `${partials[key]} $${index + 1}`) // pgp uses base-1 index
    .reduce((acc, curr) => `${acc} AND ${curr}`);

  console.log('formed query:', `${frontPortion} WHERE ${conditions}`);

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
    var dateNowFormat = moment(dateNow).format('YYYY-MM-DD');
    var bookingDateFormat = moment(bookingDate).format('YYYY-MM-DD');
    console.log("Today's date is " + dateNowFormat);
    console.log('Booking date is ' + bookingDateFormat);
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

    const update = await db.oneOrNone(
      'INSERT INTO ReserveTimeslots VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        req.query.date,
        req.query.time,
        req.query.rname,
        req.query.raddr,
        req.user.uname,
        null,
        null,
        req.query.pax
      ]
    );
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
