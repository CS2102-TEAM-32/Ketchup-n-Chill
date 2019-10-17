DROP TABLE IF EXISTS Diners CASCADE;
DROP TABLE IF EXISTS Admins CASCADE;
DROP TABLE IF EXISTS RestaurantOwners CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Incentives CASCADE;
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
  raddress varchar(50),
  rname varchar(50),
  PRIMARY KEY (raddress, rname)
);

CREATE TABLE HasTimeslots (
	date DATE,
	time TIME,
	rname VARCHAR(50),
	raddress TEXT,
	num_available integer,
	PRIMARY KEY(date, time),
	FOREIGN KEY(rname, raddress) REFERENCES OwnedRestaurants(rname, raddress) ON DELETE CASCADE
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
	FOREIGN KEY(r_date, r_time) REFERENCES HasTimeslots(date, time),
	FOREIGN KEY(rname, raddress) REFERENCES OwnedRestaurants(rname, raddress),
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
	description varchar(300),
	organisation varchar(50) NOT NULL,
	points integer NOT NULL,
	is_claimed boolean DEFAULT FALSE
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

-- Sample Starting Test Cases --
CALL add_admin('popgoesweasel', 'Chong Kay Heen', 'g00dpa$$w0rd');
CALL add_diner('qtehpie', 'Teh Wen Yi', '12345678');
CALL add_diner('wailunoob', 'Lim Wai Lun', 'wailunoob');
CALL add_diner('jackbuibui', 'Jack Chen', '01234567');
CALL add_rowner('Macdonalds', 'Ronald', 'abcdefgh');
CALL add_rowner('KFC', 'Kentucky', 'kfckfckfc');
CALL add_rowner('Dominoes', 'Domino', 'domiyess');