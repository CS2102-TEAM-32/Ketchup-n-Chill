const db = require('../db/index');

exports.showHomePage = async (req, res, next) => {
  try {
    res.render('home');
  } catch (e) {
    next(e);
  }
};
