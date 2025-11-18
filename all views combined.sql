USE ev_charging;

CREATE OR REPLACE VIEW v_session_details AS
SELECT
  cs.session_id,
  u.user_id, u.fname, u.lname,
  ca.make, ca.model,
  s.id AS station_id, s.name AS station_name,
  c.id AS charger_id, c.connector_type, c.charging_speed_kw,
  cs.startt, cs.endt,
  cs.energy_delivered_kwh, cs.cost, cs.payment_stat
FROM ChargingSession cs
JOIN Users   u  ON u.user_id   = cs.user_id
LEFT JOIN Cars ca ON ca.car_id = u.car_id
JOIN Charger c   ON c.id       = cs.charger_id
JOIN Station s   ON s.id       = c.station_id;

CREATE OR REPLACE VIEW v_operators_max_avg_rate AS
SELECT s.operator, AVG(p.rate) AS avg_rate
FROM Station s
JOIN Pricing p ON p.station_id = s.id
GROUP BY s.operator
HAVING AVG(p.rate) >= ALL (
  SELECT AVG(p2.rate)
  FROM Station s2
  JOIN Pricing p2 ON p2.station_id = s2.id
  GROUP BY s2.operator
);

CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `ev_charging`.`v_reservations_with_session` AS
    SELECT 
        `r`.`res_id` AS `res_id`,
        `r`.`user_id` AS `user_id`,
        `r`.`charger_id` AS `charger_id`,
        `r`.`startt` AS `startt`,
        `r`.`endt` AS `endt`,
        `r`.`status` AS `status`,
        EXISTS( SELECT 
                1
            FROM
                `ev_charging`.`chargingsession` `cs`
            WHERE
                (`cs`.`res_id` = `r`.`res_id`)) AS `has_session`
    FROM
        `ev_charging`.`reservation` `r`;
        
CREATE OR REPLACE VIEW v_station_pricing_full AS
SELECT s.id AS station_id, s.name, p.rate, p.stall_time, p.last_updated
FROM Station s
LEFT JOIN Pricing p ON p.station_id = s.id
UNION
SELECT s.id AS station_id, s.name, p.rate, p.stall_time, p.last_updated
FROM Station s
RIGHT JOIN Pricing p ON p.station_id = s.id;

CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `ev_charging`.`v_available_resources` AS
    SELECT 
        'Station' AS `resource_type`,
        CAST(`s`.`id` AS CHAR CHARSET UTF8MB4) AS `resource_id`,
        `s`.`name` AS `label`,
        `s`.`status` AS `status`
    FROM
        `ev_charging`.`station` `s`
    WHERE
        (`s`.`status` = 'Active') 
    UNION SELECT 
        'Charger' AS `resource_type`,
        CAST(`c`.`id` AS CHAR CHARSET UTF8MB4) AS `resource_id`,
        CONCAT('Station ',
                `c`.`station_id`,
                ' - ',
                `c`.`connector_type`,
                ' ',
                `c`.`charging_speed_kw`,
                'kW') AS `label`,
        `c`.`status` AS `status`
    FROM
        `ev_charging`.`charger` `c`
    WHERE
        (`c`.`status` = 'Available');

CREATE OR REPLACE VIEW v_station_utilization AS
SELECT
  s.id AS station_id, s.name,
  COUNT(cs.session_id)            AS sessions,
  COALESCE(SUM(cs.energy_delivered_kwh), 0) AS total_kwh,
  COALESCE(AVG(cs.energy_delivered_kwh), 0) AS avg_kwh
FROM Station s
LEFT JOIN Charger c       ON c.station_id = s.id
LEFT JOIN ChargingSession cs ON cs.charger_id = c.id
GROUP BY s.id, s.name;

CREATE OR REPLACE VIEW v_user_total_paid AS
SELECT
  u.user_id, u.fname, u.lname,
  COALESCE(SUM(cs.cost), 0) AS total_paid
FROM Users u
LEFT JOIN ChargingSession cs
  ON cs.user_id = u.user_id AND cs.payment_stat = 'Paid'
GROUP BY u.user_id, u.fname, u.lname;

CREATE OR REPLACE VIEW v_future_reservations_detail AS
SELECT
  r.res_id, r.startt, r.endt, r.status,
  u.fname, u.lname,
  s.name AS station_name,
  c.connector_type
FROM Reservation r
JOIN Users u   ON u.user_id = r.user_id
JOIN Charger c ON c.id      = r.charger_id
JOIN Station s ON s.id      = c.station_id
WHERE r.startt > NOW();

CREATE OR REPLACE VIEW v_charger_status_summary AS
SELECT
  s.id AS station_id, s.name,
  SUM(c.status = 'Available')   AS available,
  SUM(c.status = 'In Use')      AS in_use,
  SUM(c.status = 'Reserved')    AS reserved,
  SUM(c.status = 'Out of Order') AS out_of_order
FROM Station s
LEFT JOIN Charger c ON c.station_id = s.id
GROUP BY s.id, s.name;

CREATE OR REPLACE VIEW v_session_cost_vs_rate AS
SELECT
  cs.session_id,
  s.name AS station_name,
  p.rate AS posted_rate_per_kwh,
  cs.energy_delivered_kwh,
  cs.cost,
  (cs.cost / NULLIF(cs.energy_delivered_kwh, 0)) AS effective_rate_per_kwh
FROM ChargingSession cs
JOIN Charger c ON c.id = cs.charger_id
JOIN Station s ON s.id = c.station_id
LEFT JOIN Pricing p ON p.station_id = s.id;

CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `ev_charging`.`v_user_compatible_chargers` AS
    SELECT 
        `u`.`user_id` AS `user_id`,
        `u`.`fname` AS `fname`,
        `u`.`lname` AS `lname`,
        `c`.`id` AS `charger_id`,
        `s`.`name` AS `station_name`,
        `c`.`connector_type` AS `connector_type`,
        `c`.`charging_speed_kw` AS `charging_speed_kw`,
        `c`.`status` AS `status`
    FROM
        (((`ev_charging`.`users` `u`
        JOIN `ev_charging`.`cars` `ca` ON ((`ca`.`car_id` = `u`.`car_id`)))
        JOIN `ev_charging`.`charger` `c` ON ((`c`.`connector_type` = `ca`.`connector_type`)))
        JOIN `ev_charging`.`station` `s` ON ((`s`.`id` = `c`.`station_id`)))
    WHERE
        (`s`.`status` = 'Active');
	
   CREATE OR REPLACE VIEW v_station_vacancy AS
SELECT s.id AS station_id, s.name,
       s.ports,
       SUM(c.status='Available') AS free_chargers,
       (s.ports - SUM(c.status IN ('In Use','Reserved'))) AS estimated_free_ports
FROM Station s
LEFT JOIN Charger c ON c.station_id = s.id
GROUP BY s.id, s.name, s.ports; 

CREATE OR REPLACE VIEW v_next_available_per_station AS
SELECT
  s.id  AS station_id,
  s.name,
  CASE
    /* If any charger is currently busy at this station */
    WHEN SUM(c.status IN ('In Use','Reserved')) > 0 THEN
      /* Soonest end among reservations overlapping NOW() */
      COALESCE((
        SELECT MIN(r.endt)
        FROM Reservation r
        JOIN Charger c2 ON c2.id = r.charger_id
        WHERE c2.station_id = s.id
          AND r.status NOT IN ('Cancelled')           -- ignore cancelled
          AND r.startt <= NOW() AND r.endt > NOW()    -- overlaps NOW()
      ), NOW())
    /* Otherwise, it’s free right now */
    ELSE NOW()
  END AS next_free_after
FROM Station s
LEFT JOIN Charger c ON c.station_id = s.id
GROUP BY s.id, s.name;

CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `ev_charging`.`v_station_reliability` AS
    SELECT 
        `s`.`id` AS `station_id`,
        `s`.`name` AS `name`,
        SUM((`c`.`status` = 'Out of Order')) AS `ooo`,
        COUNT(`c`.`id`) AS `chargers`,
        (1 - (SUM((`c`.`status` = 'Out of Order')) / NULLIF(COUNT(`c`.`id`), 0))) AS `reliability_score`
    FROM
        (`ev_charging`.`station` `s`
        LEFT JOIN `ev_charging`.`charger` `c` ON ((`c`.`station_id` = `s`.`id`)))
    GROUP BY `s`.`id` , `s`.`name`