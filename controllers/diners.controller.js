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
  if (!req.body.username || !req.body.name) return res.sendStatus(400);
  try {
    const diner = await db.one(
      'INSERT INTO Diners (username, name) VALUES ($1, $2) RETURNING *',
      [req.body.username, req.body.name]
    );
    res.redirect('/diners/' + diner.username);
  } catch (e) {
    next(e);
  }
};

exports.deleteDiner = async (req, res, next) => {
  try {
    await db.one('DELETE FROM Diners WHERE username=$1 RETURNING *', [
      req.params.username
    ]);
    res.sendStatus(200);
  } catch (e) {
    next(e);
  }
};
