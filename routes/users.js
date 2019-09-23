var express = require('express');
var router = express.Router();

const db = require('../db/index');

router.get('/', async (_req, res, next) => {
  try {
    const users = await db.any('SELECT * FROM Users');
    res.render('users', {
      title: 'Users',
      users: users
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
