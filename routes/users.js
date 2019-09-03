var express = require('express');
var router = express.Router();

const db = require('../db/index');

/* GET users listing. */
router.get('/', async (_req, res, next) => {
  try {
    const users = await db.any('SELECT * FROM Users');
    res.render('showUsers', {title: 'Users', users: users.map(user => user.name)})
  } catch (e) {
    next(e);
  }
});

module.exports = router;
