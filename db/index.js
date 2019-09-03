const pgp = require('pg-promise')();

const connectionUrl = "postgres://wailun:wailun@localhost:5432/wailun";
const db = pgp(connectionUrl);

module.exports = db;