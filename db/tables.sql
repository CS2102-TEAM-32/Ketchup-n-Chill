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

-- Called from trigger to check if there exist a ReservedTimeslot upon deletion of an existing timeslot 
CREATE OR REPLACE FUNCTION checkExistingReservation() 
RETURNS TRIGGER AS $$
DECLARE count NUMERIC;
BEGIN 
	RAISE NOTICE 'Trigger called';
	SELECT COUNT(*) INTO count FROM ReserveTimeslots R 
		WHERE OLD.rname = R.rname AND OLD.raddress = R.raddress 
			AND OLD.time = R.r_time AND OLD.date = R.r_date;
	IF count > 0 THEN 
		RETURN NULL;
	ELSE 
		RETURN OLD;
	END IF;
END; 
$$ LANGUAGE plpgsql;

-- Trigger to call upon deletion of a timeslot. 
CREATE TRIGGER checkDeleteSuccess
BEFORE DELETE ON HasTimeslots 
FOR EACH ROW EXECUTE PROCEDURE checkExistingReservation();
-- Set Up --

-- Call when trying to add to ReserveTimeslots
CREATE OR REPLACE FUNCTION check_pax()
RETURNS TRIGGER AS $$ 
DECLARE 
	totalPaxSoFar integer;
	newTotal integer;
	numTimeslots integer;
	maxPax integer;
BEGIN
	SELECT SUM(num_diners) INTO totalPaxSoFar
	FROM ReserveTimeslots R
	WHERE R.r_date = NEW.r_date AND R.r_time = NEW.r_time AND R.rname = NEW.rname AND R.raddress = NEW.raddress;
	
	SELECT T.num_available INTO maxPax
	FROM HasTimeslots T
	WHERE T.rname = NEW.rname AND T.raddress = NEW.raddress AND T.date = NEW.r_date AND T.time = NEW.r_time;

	SELECT COUNT(*) INTO numTimeslots 
	FROM HasTimeSlots T 
	WHERE T.date = NEW.r_date AND T.time = NEW.r_time AND T.raddress = NEW.raddress AND T.rname = NEW.rname;

	IF totalPaxSoFar IS NULL THEN
		totalPaxSoFar := 0;
	END IF;

	newTotal := totalPaxSoFar + NEW.num_diners;
	IF numTimeslots = 0 THEN
		RAISE NOTICE 'No such timeslot';
		RETURN NULL; 
	ELSIF newTotal <= maxPax AND numTimeslots > 0 THEN
		RETURN NEW; 
	ELSE
		RAISE NOTICE 'Total Existing Pax % Exceeds Max Pax of %', newTotal, maxPax;
		RETURN NULL;
	END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reservetimeslots
BEFORE INSERT OR UPDATE ON ReserveTimeslots
FOR EACH ROW EXECUTE PROCEDURE check_pax();

-- Test data
-- 51 pax exceed 50 
INSERT INTO ReserveTimeslots VALUES('2019-11-06', '10:00', 'A Night In Paris', '554 Cambridge Crossing', 'kh', 'gr8', '4', '51');
DELETE FROM ReserveTimeslots WHERE r_date = '2019-11-06';
-- No such timeslot
INSERT INTO ReserveTimeslots VALUES('2019-12-28', '10:00', 'A Night In Paris', '554 Cambridge Crossing', 'kh', 'gr8', '4', '51');