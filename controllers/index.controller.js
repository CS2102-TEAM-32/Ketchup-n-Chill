const db = require('../db/index');

exports.showHomePage = async (req, res, next) => {
  try {
    const restaurants = await db.any('SELECT rname, cuisine, round(AVG(rating)) AS avg FROM ReserveTimeSlots NATURAL JOIN OwnedRestaurants GROUP BY rname, cuisine ORDER BY AVG(rating) DESC, rname LIMIT 3');
    res.render('home', {
      title: 'Ketchup and Chill!',
      restaurants: restaurants
    });
  } catch (e) {
    next(e);
  }
};