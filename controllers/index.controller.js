const db = require('../db/index');
const moment = require('moment');

exports.showHomePage = async (req, res, next) => {
  try {
    const restaurants = await db.any('SELECT rname, round(AVG(rating)) AS avg FROM ReserveTimeSlots GROUP BY rname ORDER BY AVG(rating) DESC, rname LIMIT 3');
    res.render('home', {
      title: 'Ketchup and Chill!',
      date: moment().format('YYYY-MM-DD'),
      restaurants: restaurants
    });
  } catch (e) {
    next(e);
  }
};
