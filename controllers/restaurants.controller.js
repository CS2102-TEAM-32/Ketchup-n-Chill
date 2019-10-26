const db = require('../db/index');

/* show all restaurants or selected restaurants based on req.query */
exports.showRestaurants = async (req, res, next) => {
  try {
    const pgpSqlQuery = generatePgpSqlQuery(
      'SELECT DISTINCT rname FROM OwnedRestaurants NATURAL JOIN HasTimeslots',
      req.query
    );

    const restaurants = await db.any(pgpSqlQuery, Object.values(req.query));
    console.log(restaurants.length);

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
 helper function to generate the string to be passed to pg promise.
 takes in a string 'select ... from ...' as the first parameter.
 the second parameter is a req.query object.
 adds the where clause to the original string based on the keys from req.query object.
*/
function generatePgpSqlQuery(frontPortion, reqQueries) {
  const keys = Object.keys(reqQueries);
  if (keys.length === 0) {
    return frontPortion;
  }

  const conditions = keys
    .map((key, index) => `${key} = $${index + 1}`) // want a base-1 index
    .reduce((acc, curr) => `${acc} AND ${curr}`);
  return `${frontPortion} WHERE ${conditions}`;
}
