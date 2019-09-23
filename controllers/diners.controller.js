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

exports.registerDiner = (req, res, next) => {
  res.render('register', {
    title: 'Register'
  });
};

exports.createDiner = async (req, res, next) => {
  console.log(req.body);
  if (!req.body.username || !req.body.name) return res.sendStatus(400);
  try {
    const diner = await db.one(
      'INSERT INTO Diners (username, name) VALUES ($1, $2) RETURNING *',
      [req.body.username, req.body.name]
    );
    res.render('diner', {
      title: diner.username,
      diner: diner
    });
  } catch (e) {
    next(e);
  }
};
