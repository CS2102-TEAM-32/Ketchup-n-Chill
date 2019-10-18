# Ketchup & Chill!

## Setup: MAC
1. Run `npm install`
2. In db/index.js, change the connectionUrl to your own
3. Do `export PGUSER=yourusername`, `export PGPASSWORD=yourpassword`, `export PGDATABASE=yourdatabase`, `export PGHOST=localhost` individually
4. Create the session table by doing `psql yourdatabase < node_modules/connect-pg-simple/table.sql`
5. Run `CONNECTION_URL=postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase npm start`
6. Visit http://localhost:3000

## Setup: Windows
1. Run `npm install`
2. In db/index.js, change the connectionUrl to your own
3. Do `set PGUSER=yourusername`, `set PGPASSWORD=yourpassword`, `set PGDATABASE=yourdatabase`, `set PGHOST=localhost` individually
4. Create the following table in your database:

```
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
 "sess" json NOT NULL,
 "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" 
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
```

5. Run `CONNECTION_URL=postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase`
6. Run `npm start`
6. Visit http://localhost:3000

## Additional Information
- Using Node.js v12.2.0
