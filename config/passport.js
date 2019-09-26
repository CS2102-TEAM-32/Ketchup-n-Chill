const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../db/index');

module.exports = passport => {
  passport.use(
    new LocalStrategy((username, password, done) => {
      db.one('SELECT * FROM Diners WHERE username=$1', [username])
        .then(diner => {
          return new Promise((resolve, reject) => {
            bcrypt.compare(password, diner.password, (err, isMatch) => {
              if (err) return reject(err);
              if (!isMatch) return resolve(null);
              return resolve(diner);
            });
          });
        })
        .then(diner => {
          if (!diner) return done(null, false, { message: 'Wrong password' });
          return done(null, diner, { message: 'Successfully logged in.' });
        })
        .catch(e => done(null, false, { message: 'No such user.' }));
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.username);
  });

  passport.deserializeUser((username, done) => {
    db.one('SELECT * FROM Diners WHERE username=$1', [username])
      .then(diner => done(null, diner))
      .catch(e => done(e, null));
  });
};
