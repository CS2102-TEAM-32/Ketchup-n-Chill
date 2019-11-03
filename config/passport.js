const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/index');

module.exports = passport => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'uname', passwordField: 'pass' },
      async (uname, pass, done) => {
        const diner = await db.oneOrNone(
          'SELECT * FROM Users NATURAL JOIN Diners WHERE uname=$1',
          [uname]
        );
        const restaurantOwner = await db.oneOrNone(
          'SELECT * FROM Users NATURAL Join RestaurantOwners WHERE uname = $1',
          [uname]
        );

        let promise;

        // there is no user who is both a diner and restaurant owner
        if (diner) {
          diner.type = 'diner';
          console.log(diner);
          promise = Promise.resolve(diner);
        } else if (restaurantOwner) {
          restaurantOwner.type = 'restaurantOwner';
          promise = Promise.resolve(restaurantOwner);
        } else {
          promise = Promise.reject();
        }

        promise
          .then(user => {
            return new Promise((resolve, reject) => {
              bcrypt.compare(pass, user.pass, (err, isMatch) => {
                if (err) return reject(err);
                if (!isMatch) return resolve(null);
                return resolve(user);
              });
            });
          })
          .then(user => {
            if (!user) return done(null, false, { message: 'Wrong password' });
            return done(null, user, { message: 'Successfully logged in.' });
          })
          .catch(e => done(null, false, { message: 'No such user.' }));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, { uname: user.uname, type: user.type });
  });

  passport.deserializeUser((user, done) => {
    db.one('SELECT * FROM Users WHERE uname=$1', [user.uname])
      .then(info => {
        info.type = user.type;
        done(null, info);
      })
      .catch(e => done(e, null));
  });
};
