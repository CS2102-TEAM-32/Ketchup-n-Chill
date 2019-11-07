DROP TABLE IF EXISTS Diners CASCADE;
DROP TABLE IF EXISTS Admins CASCADE;
DROP TABLE IF EXISTS RestaurantOwners CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Incentives CASCADE;
DROP TABLE IF EXISTS Vouchers CASCADE;
DROP TABLE IF EXISTS Menu CASCADE;
DROP TABLE IF EXISTS FoodItems CASCADE;
DROP TABLE IF EXISTS OwnedRestaurants CASCADE;
DROP TABLE IF EXISTS HasTimeslots CASCADE;
DROP TABLE IF EXISTS ReserveTimeslots CASCADE; 

CREATE TABLE Users (
	uname varchar(50) PRIMARY KEY,
	name varchar(50) NOT NULL,
	pass varchar(256) NOT NULL
);

CREATE TABLE Diners (
	uname varchar(50) PRIMARY KEY REFERENCES Users(uname) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Admins (
	uname varchar(50) PRIMARY KEY REFERENCES Users(uname) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE RestaurantOwners (
  	uname varchar(50) PRIMARY KEY REFERENCES Users(uname) ON DELETE CASCADE ON UPDATE CASCADE
 );

CREATE TABLE OwnedRestaurants (
  uname varchar(50) REFERENCES RestaurantOwners(uname) ON DELETE SET NULL ON UPDATE CASCADE,
  raddress varchar(1024),
  rname varchar(50),
  cuisine varchar(50),
  phone_num varchar(50),
  opening_hr varchar(50),
  closing_hr varchar(50),
  PRIMARY KEY (raddress, rname)
);

CREATE TABLE HasTimeslots (
	date DATE,
	time TIME,
	rname VARCHAR(50),
	raddress varchar(1024),
	num_available integer,
	PRIMARY KEY(rname, raddress, date, time),
	FOREIGN KEY(rname, raddress) REFERENCES OwnedRestaurants(rname, raddress) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ReserveTimeslots (
	r_date DATE, 
	r_time TIME,
	rname varchar(50),
	raddress TEXT,
	duname varchar(50) REFERENCES Diners(uname),
	review TEXT,
	rating INTEGER CHECK ((rating IS NULL) OR (rating >= 0 AND rating <= 5)),
	num_diners integer,
	is_complete boolean DEFAULT FALSE,
	FOREIGN KEY(rname, raddress, r_date, r_time) REFERENCES HasTimeslots(rname, raddress, date, time)
	ON UPDATE CASCADE,
	PRIMARY KEY(r_date, r_time, rname, raddress, duname)
);

CREATE TABLE Menu (
	title VARCHAR(100),
	rname  VARCHAR(100),
	raddress  TEXT,
	PRIMARY KEY (title, rname, raddress),
	FOREIGN KEY (rname, raddress) REFERENCES OwnedRestaurants (rname, raddress) ON DELETE CASCADE	
);

CREATE TABLE FoodItems (
	fname VARCHAR(100),
	price float, 
	title VARCHAR(100),
	rname VARCHAR(100),
	raddress TEXT,
	PRIMARY KEY (fname, title, rname, raddress),
	FOREIGN KEY (title, rname, raddress) REFERENCES Menu (title, rname, raddress) ON DELETE CASCADE
);

CREATE TABLE Incentives (
	title varchar(50) NOT NULL,
	description varchar(500),
	organisation varchar(50) NOT NULL,
	points integer NOT NULL,
	max_claims integer NOT NULL,
	PRIMARY KEY (title, organisation)
);

CREATE TABLE Vouchers (
	title varchar(50),
	organisation varchar(50),
	code varchar(50),
	duname varchar(50),
	redeemed boolean DEFAULT FALSE,
	PRIMARY KEY (title, organisation, code),
	FOREIGN KEY (title, organisation) REFERENCES Incentives (title, organisation) ON DELETE CASCADE,
	FOREIGN KEY (duname) REFERENCES Diners(uname) ON DELETE CASCADE
);


-- Stored Procedures --
-- Call when adding Diners:
CREATE OR REPLACE PROCEDURE add_diner(uname varchar(50),
										name varchar(50),
										pass varchar(256))
AS $$ BEGIN
INSERT INTO Users VALUES (uname, name, pass);
INSERT INTO Diners VALUES (uname);
END; $$ LANGUAGE plpgsql;

-- Call when adding Admin:
CREATE OR REPLACE PROCEDURE add_admin(uname varchar(50),
										name varchar(50),
										pass varchar(256))
AS $$ BEGIN
INSERT INTO Users VALUES (uname, name, pass);
INSERT INTO Admins VALUES (uname);
END; $$ LANGUAGE plpgsql;

-- Call when adding Restaurant Owners:
CREATE OR REPLACE PROCEDURE add_rowner(uname varchar(50),
										name varchar(50),
										pass varchar(256))
AS $$ BEGIN
INSERT INTO Users VALUES (uname, name, pass);
INSERT INTO RestaurantOwners VALUES (uname);
END; $$ LANGUAGE plpgsql;

-- Call when trying to add to ReserveTimeslots
CREATE OR REPLACE FUNCTION check_pax()
RETURNS TRIGGER AS $$ 
DECLARE 
	totalPaxSoFar integer;
	maxPax integer;
BEGIN
	SELECT SUM(num_diners) INTO totalPaxSoFar
	FROM ReserveTimeslots R
	GROUP BY (R.r_date, R.r_time, R.rname, R.raddress)
	HAVING r_date = NEW.r_date AND r_time = NEW.r_time AND rname = NEW.rname AND raddress = NEW.raddress;
	
	SELECT T.num_diners INTO maxPax
	FROM HasTimeslots T
	WHERE T.rname = NEW.rname AND T.raddress = NEW.raddress AND T.date = NEW.r_date AND T.time = NEW.r_time;

	IF totalPaxSoFar + NEW.num_diners > maxPax THEN
		RETURN NULL; 
	ELSE
		RETURN NEW;
	END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reservetimeslots()
BEFORE INSERT OR UPDATE ON ReserveTimeslots
FOR EACH ROW EXECUTE PROCEDURE check_pax()