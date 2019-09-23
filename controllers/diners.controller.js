const db = require('../db/index');

exports.showAllDiners = async (req, res, next) => {
  try {
    const diners = await db.any('SELECT * FROM Diners');
    res.render('diners', {
      title: 'Diners',
      diners: diners
    });
  } catch (e) {
    next(e);
  }
};

exports.showDinerParticulars = async (req, res, next) => {
  try {
    const diner = await db.one('SELECT * FROM Diners WHERE username=$1', [
      req.params.username
    ]);
    res.render('diner', {
      title: diner.username,
      diner: diner
    });
  } catch (e) {
    next(e);
  }
};
