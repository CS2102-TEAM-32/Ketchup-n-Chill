const db = require('../db/index');

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
    res.sendStatus(500);
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
    const timeslots = await db.many(
      'SELECT * FROM HasTimeslots WHERE rname=$1 AND raddress =$2 AND num_available > 0',
      [req.params.rname, req.params.raddress]
    );

    return res.render('timeslots', {
      timeslotList: timeslots,
      restName: timeslots[0].rname
    });
  } catch (e) {
    console.log(e);
    return res.sendStatus(404);
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
    cuisine: 'upper(cuisine) LIKE',
    rname: 'upper(rname) LIKE'
  };

  const keys = Object.keys(reqQuery);
  console.log('keys', keys);
  if (keys.length === 0) {
    // the req.query object is empty, we will query without a where clause.
    return f(frontPortion);
  }

  const conditions = keys
    .filter(key => reqQuery[key] !== '') // if they are empty, don't include in where clause
    .map((key, index) => `${partials[key]} $${index + 1}`) // pgp uses base-1 index
    .reduce((acc, curr) => `${acc} AND ${curr}`);

  // console.log('formed query:', `${frontPortion} WHERE ${conditions}`);

  Object.keys(reqQuery).forEach(key => {
    if (key === 'cuisine' || key === 'rname') {
      // for these queries we form a pattern
      reqQuery[key] = '%' + reqQuery[key].toUpperCase() + '%';
    }
  });

  console.log('modified', reqQuery);

  // make the function call and return the promise
  return f(
    `${frontPortion} WHERE ${conditions}`,
    Object.values(reqQuery).filter(value => value !== '')
  );
}

exports.bookRestaurant = async (req, res, next) => {
  try {
    // Need to fix this part
    const booking = await queryDbFromReqQueryForBooking(
      'SELECT * FROM HasTimeslots',
      req.query,
      db.oneOrNone
    );
    console.log(booking);
    if (booking != null) {
      // do DB stuff here to insert into reservetimeslot
      /*      const update = await db.one("INSERT INTO ReserveTimeslot SET duname = $1 WHERE title = $2 AND organisation = $3 AND code = $4 RETURNING *", [
        req.user.uname,
        booking.r_date,
        booking.r_time,
        booking.rname,
        booking.raddr,
        booking.
      ]);*/
      res.json(1);
    } else {
      res.json(0);
    }
  } catch (e) {
    console.log(e);
    next(e);
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
