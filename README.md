# Ketchup & Chill!

## Setup
1. Run `npm install`
2. In db/index.js, change the connectionUrl to your own
3. Do `export PGUSER=yourusername`, `export PGPASSWORD=yourpassword`, `export PGDATABASE=yourdatabase`
4. Create the session table by doing `psql yourdatabase < node_modules/connect-pg-simple/table.sql`
5. Run `npm start`
6. Visit http://localhost:3000

## Additional Information
- Using Node.js v12.2.0
