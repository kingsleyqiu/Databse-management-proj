require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Sequelize } = require('sequelize');

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Connect to MySQL using Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql'
  }
);

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('Connected to MySQL successfully.'))
  .catch(err => console.error('Database connection failed:', err));

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const loginRoutes = require('./routes/loginRoutes');
app.use('/api/login', loginRoutes);

const stationRoutes = require('./routes/stationRoutes');
app.use('/api/stations', stationRoutes);

const exportRoutes = require('./routes/exportRoutes');
app.use('/api/export', exportRoutes);

const viewRoutes = require("./routes/viewRoutes");
app.use("/api/views", viewRoutes);

const sessionRoutes = require('./routes/sessionRoutes');
app.use('/api/sessions', sessionRoutes);

const reservationRoutes = require('./routes/reservationRoutes');
app.use('/api/reservations', reservationRoutes);

app.get('/', (req, res) => {
  res.send('EV Charging API is running');
});
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
