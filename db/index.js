const pgp = require('pg-promise')();

// follow: "postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase"
const connectionUrl = process.env.CONNECTION_URL;
const db = pgp(connectionUrl);

module.exports = db;