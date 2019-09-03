const pgp = require('pg-promise')();

// temp connectionUrl
// follow: "postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase"
const connectionUrl = "postgres://wailun:wailun@localhost:5432/wailun";
const db = pgp(connectionUrl);

module.exports = db;