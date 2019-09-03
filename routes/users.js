var express = require('express');
var router = express.Router();

const db = require('../db/index');

/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.send('respond with a resource');
  db.any('SELECT * FROM Users')
    .then(data => {
      res.send(data);
    })
});

module.exports = router;
