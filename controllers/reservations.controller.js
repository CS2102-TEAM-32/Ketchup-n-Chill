const db = require('../db/index');
const moment = require('moment');

exports.showAllReservations = async (req, res, next) => {
  try {
    // get the reservations belonging to the restaurant owner
    const reservations = await db.manyOrNone(
      'SELECT * FROM ReserveTimeslots NATURAL JOIN OwnedRestaurants WHERE is_complete=FALSE AND r_date=$1 AND uname=$2',
      [moment().format('YYYY-MM-DD'), req.user.uname]
    );
    console.log(reservations);
    res.render('restaurant-owner-reservations', {
      reservations
    });
  } catch (e) {
    console.log(e.toString());
    res.sendStatus(404);
  }
};

exports.setComplete = async (req, res, next) => {
  try {
    // check if that the timeslot should be allowed to be updated by this user
    await db.one(
      'SELECT * FROM ReserveTimeslots NATURAL JOIN OwnedRestaurants WHERE rname=$1 AND r_date=$2 AND r_time=$3 AND raddress=$4 AND duname=$5 AND uname=$6',
      [
        req.body.rname,
        req.body.r_date,
        req.body.r_time,
        req.body.raddress,
        req.body.duname
      ]
    );
    await db.one(
      'UPDATE ReserveTimeslots SET is_complete=TRUE WHERE rname=$1 AND r_date=$2 AND r_time=$3 AND raddress=$4 AND duname=$5 RETURNING *',
      [
        req.body.rname,
        req.body.r_date,
        req.body.r_time,
        req.body.raddress,
        req.body.duname
      ]
    );
    req.flash('success', 'Completed!');
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(401);
  }
};
