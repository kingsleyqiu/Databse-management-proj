const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Get all cars
app.get("/cars", (req, res) => {
    db.query("SELECT * FROM Cars", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get all stations
app.get("/stations", (req, res) => {
    db.query("SELECT * FROM Station", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get station details by ID
app.get("/stations/:id", (req, res) => {
    const stationId = req.params.id;

    db.query("SELECT * FROM Station WHERE id = ?", [stationId], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length === 0) {
            return res.status(404).json({ message: "Station not found" });
        }

        res.json(results[0]);
    });
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
