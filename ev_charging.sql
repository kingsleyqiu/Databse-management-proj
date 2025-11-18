CREATE DATABASE IF NOT EXISTS ev_charging;
USE ev_charging;


CREATE TABLE IF NOT EXISTS Cars (
    car_id INT AUTO_INCREMENT PRIMARY KEY,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    battery_capacity_kwh DECIMAL(5,2),
    connector_type VARCHAR(50) NOT NULL
);


CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL DEFAULT 'password123',
    role ENUM('admin', 'user', 'guest') DEFAULT 'user',
    car_id INT,
    FOREIGN KEY (car_id) REFERENCES Cars(car_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS Station (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    operator VARCHAR(100),
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    ports INT DEFAULT 1,
    status ENUM('Active', 'Maintenance', 'Offline') DEFAULT 'Active'
);


CREATE TABLE IF NOT EXISTS Charger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    connector_type VARCHAR(50) NOT NULL,
    charging_speed_kw DECIMAL(5,2) NOT NULL,
    status ENUM('Available', 'In Use', 'Reserved', 'Out of Order') DEFAULT 'Available',
    FOREIGN KEY (station_id) REFERENCES Station(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS Reservation (
    res_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    charger_id INT NOT NULL,
    startt DATETIME NOT NULL,
    endt DATETIME NOT NULL,
    status ENUM('Reserved', 'Cancelled', 'Completed', 'Expired') DEFAULT 'Reserved',
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (charger_id) REFERENCES Charger(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS ChargingSession (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    charger_id INT NOT NULL,
    res_id INT,
    startt DATETIME NOT NULL,
    endt DATETIME NOT NULL,
    energy_delivered_kwh DECIMAL(6,2) NOT NULL,
    cost DECIMAL(8,2) NOT NULL,
    payment_stat ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (charger_id) REFERENCES Charger(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (res_id) REFERENCES Reservation(res_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS Pricing (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    stall_time DECIMAL(5,2),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES Station(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_station_status ON Station(status);
CREATE INDEX idx_charger_status ON Charger(status);
CREATE INDEX idx_reservation_time ON Reservation(startt, endt);
CREATE INDEX idx_session_user ON ChargingSession(user_id);
