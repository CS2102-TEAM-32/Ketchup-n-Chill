# Ketchup & Chill!

## Setup: MAC
1. Run `npm install`
2. Do `export PGUSER=yourusername`, `export PGPASSWORD=yourpassword`, `export PGDATABASE=yourdatabase`, `export PGHOST=localhost` individually
3. Create the session table by doing `psql yourdatabase < node_modules/connect-pg-simple/table.sql`
4. Run `CONNECTION_URL=postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase npm start`
5. Visit http://localhost:3000

## Setup: Windows
1. Run `npm install`
2. Create the following table in your database:

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

3. Do `set PGUSER=yourusername`, `set PGPASSWORD=yourpassword`, `set PGDATABASE=yourdatabase`, `set PGHOST=localhost` individually
4. Do `SET CONNECTION_URL=postgres://YourUserName:YourPassword@YourHost:5432/YourDatabase`
5. Run `npm start`
6. Visit http://localhost:3000

## Importing data into database using csv files
1. Ensure that the table has been created 
2. in PSQL, enter the following code to mass insert into table
```
copy <table_name> from 'directory/file.csv' with csv header;
```

## Additional Information
- Using Node.js v12.2.0
