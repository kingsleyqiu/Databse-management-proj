INSERT INTO Cars (make, model, battery_capacity_kwh, connector_type) VALUES
('Tesla', 'Model 3', 60.0, 'Type2'),
('Nissan', 'Leaf', 40.0, 'CHAdeMO'),
('Chevrolet', 'Bolt EV', 66.0, 'CCS'),
('BMW', 'i3', 42.2, 'CCS'),
('Hyundai', 'Kona EV', 64.0, 'CCS'),
('Ford', 'Mustang Mach-E', 88.0, 'CCS');

INSERT INTO Users (fname, lname, email, phone, car_id) VALUES
('Alice', 'Green', 'alice@example.com', '416-555-1001', 1),
('Bob', 'Smith', 'bob@example.com', '416-555-1002', 2),
('Cathy', 'Brown', 'cathy@example.com', '416-555-1003', 3),
('David', 'Lee', 'david@example.com', '416-555-1004', 4),
('Ella', 'White', 'ella@example.com', '416-555-1005', 5),
('Frank', 'Jones', 'frank@example.com', '416-555-1006', 6);

INSERT INTO Station (name, operator, address, latitude, longitude, ports, status) VALUES
('Downtown Toronto Station', 'ChargeON', '123 King St W, Toronto', 43.6500, -79.3830, 4, 'Active'),
('Scarborough Station', 'EV Plus', '45 Eglinton Ave E, Toronto', 43.7750, -79.2500, 3, 'Active'),
('Mississauga Central', 'PlugSmart', '20 Hurontario St, Mississauga', 43.5900, -79.6400, 6, 'Maintenance'),
('North York Station', 'ChargeON', '200 Yonge St, North York', 43.7700, -79.4100, 5, 'Active'),
('Brampton West Station', 'PowerFlow', '80 Queen St W, Brampton', 43.6900, -79.7600, 4, 'Active'),
('Oshawa Station', 'EV Plus', '10 Simcoe St S, Oshawa', 43.9000, -78.8600, 3, 'Offline');

INSERT INTO Charger (station_id, connector_type, charging_speed_kw, status) VALUES
(1, 'Type2', 11.0, 'Available'),
(1, 'CCS', 50.0, 'In Use'),
(2, 'CHAdeMO', 50.0, 'Available'),
(3, 'CCS', 22.0, 'Reserved'),
(4, 'CCS', 11.0, 'Available'),
(5, 'Type2', 22.0, 'Out of Order');

INSERT INTO Reservation (user_id, charger_id, startt, endt, status) VALUES
(1, 1, '2025-11-04 09:00:00', '2025-11-04 10:00:00', 'Completed'),
(2, 2, '2025-11-04 10:30:00', '2025-11-04 11:30:00', 'Reserved'),
(3, 3, '2025-11-04 12:00:00', '2025-11-04 13:00:00', 'Cancelled'),
(4, 4, '2025-11-05 08:00:00', '2025-11-05 09:00:00', 'Reserved'),
(5, 5, '2025-11-05 09:30:00', '2025-11-05 10:30:00', 'Completed'),
(6, 6, '2025-11-06 11:00:00', '2025-11-06 12:00:00', 'Expired');

INSERT INTO ChargingSession (user_id, charger_id, res_id, startt, endt, energy_delivered_kwh, cost, payment_stat) VALUES
(1, 1, 1, '2025-11-04 09:05:00', '2025-11-04 09:55:00', 18.5, 7.40, 'Paid'),
(2, 2, 2, '2025-11-04 10:35:00', '2025-11-04 11:25:00', 22.0, 8.80, 'Pending'),
(3, 3, 3, '2025-11-04 12:05:00', '2025-11-04 12:45:00', 10.5, 4.20, 'Failed'),
(4, 4, 4, '2025-11-05 08:05:00', '2025-11-05 08:55:00', 25.0, 9.50, 'Paid'),
(5, 5, 5, '2025-11-05 09:35:00', '2025-11-05 10:25:00', 20.0, 7.80, 'Paid'),
(6, 6, 6, '2025-11-06 11:05:00', '2025-11-06 11:55:00', 15.0, 6.00, 'Pending');

INSERT INTO Pricing (station_id, rate, stall_time, last_updated) VALUES
(1, 0.40, 0.10, '2025-11-01 00:00:00'),
(2, 0.35, 0.08, '2025-11-02 00:00:00'),
(3, 0.38, 0.09, '2025-11-03 00:00:00'),
(4, 0.42, 0.10, '2025-11-04 00:00:00'),
(5, 0.39, 0.07, '2025-11-05 00:00:00'),
(6, 0.36, 0.09, '2025-11-06 00:00:00');