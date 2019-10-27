const db = require('../db/index');

/* show all restaurants or selected restaurants based on req.query */
exports.showRestaurants = async (req, res, next) => {
  // take note: clause for num_available should not be just using =

  console.log(req.query);
  try {
    const restaurants = await queryDbFromReqQuery(
      'SELECT DISTINCT rname FROM OwnedRestaurants NATURAL JOIN HasTimeslots',
      req.query,
      db.any
    );

    res.render('restaurants', {
      title: 'Restaurants',
      restaurants: restaurants
    });
  } catch (e) {
    next(e);
  }
};

exports.showRestaurantProfile = async (req, res, next) => {
  try {
    const restaurant = await db.one(
      'SELECT * FROM OwnedRestaurants where rname=$1',
      [req.params.rname]
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
