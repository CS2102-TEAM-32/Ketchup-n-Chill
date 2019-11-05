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
	PRIMARY KEY (fname, price, title, rname, raddress),
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

-- Sample testing for Top 3 Restaurants --
INSERT INTO Users(uname,name, pass) values  ('kh', 'kayheen', '123'), ('wy', 'wenyi', '456'), ('Twayne', 'Thomas Wayne', '123'), ('Bwayne', 'Bruce Wayne', '123');
INSERT INTO Diners values ('kh');
INSERT INTO RestaurantOwners values ('wy'), ('Twayne'), ('Bwayne');
-- rname, address, uname, cuisine, phone_num, opening_hr, closing_hr
INSERT INTO OwnedRestaurants values ('wy', 'fudstreet', 'Popeyes', 'Fast Food', '9111 0000', '0900', '2100'), ('wy', '1street', 'Bibimbap', 'Korean', '9123 4567', '0900', '2200');
INSERT INTO OwnedRestaurants values('Twayne', '51 Ang Mo Kio Ave 3, #01-04 51@AMK, Singapore 569922', 'Bangkok Jam', 'Thai', '9114 4444', '0800', '2100');
INSERT INTO OwnedRestaurants values('Bwayne', '#01, 490 Lor 6 Toa Payoh, 11, Singapore 310490', 'Mcdonalds', 'Fast Food', '9114 4445', '0800', '2100');
INSERT INTO HasTimeslots values ('2019-10-19', '10:00', 'Popeyes', 'fudstreet', 10), ('2019-10-19', '12:00', 'Popeyes', 'fudstreet', 10), ('2019-10-19', '14:00', 'Bibimbap', '1street', 10);
INSERT INTO ReserveTimeslots values ('2019-10-19', '10:00', 'Popeyes', 'fudstreet', 'kh', 'gr8', '3', '2', TRUE), ('2019-10-19', '12:00', 'Popeyes', 'fudstreet', 'kh', 'gr9', '4','3', TRUE), ('2019-10-19', '14:00', 'Bibimbap', '1street', 'kh', 'gr10', '5', '2', TRUE);
INSERT INTO ReserveTimeslots values ('2019-10-19', '10:00', 'Bangkok Jam', '51 Ang Mo Kio Ave 3, #01-04 51@AMK, Singapore 569922', 'kh', 'gr10', '3', '2', TRUE); 
-- Sample testing for home page search
INSERT INTO HasTimeslots VALUES ('2019-12-12', '10:00', 'Popeyes', 'fudstreet', '10'); -- Simple test for search, search using date: 12 December 2019, time: 10:00AM (or none), etc
INSERT INTO HasTimeslots VALUES ('2019-12-25', '12:00', 'Bibimbap', '1street', '15'); -- Another test for search
INSERT INTO HasTimeslots VALUES ('2019-10-19', '10:00', 'Bangkok Jam', '51 Ang Mo Kio Ave 3, #01-04 51@AMK, Singapore 569922', '18');
INSERT INTO HasTimeslots VALUES ('2019-11-03', '10:00', 'Bangkok Jam', '51 Ang Mo Kio Ave 3, #01-04 51@AMK, Singapore 569922', '18');

