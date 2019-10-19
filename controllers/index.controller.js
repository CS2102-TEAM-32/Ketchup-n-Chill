const db = require('../db/index');

exports.showHomePage = async (req, res, next) => {
  try {
    const restaurant = await db.any('SELECT rname, round(AVG(rating)) AS avg FROM ReserveTimeSlots GROUP BY rname ORDER BY AVG(rating) DESC, rname LIMIT 3');
    res.render('home', {
      title: 'Ketchup and Chill!',
      restaurants: restaurant
    });
  } catch (e) {
    next(e);
  }
};
