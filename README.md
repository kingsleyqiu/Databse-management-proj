# EV Charging Station Management System

A comprehensive web-based database management system for electric vehicle (EV) charging stations. This system allows users to manage charging stations, make reservations, track charging sessions, and generate detailed reports and analytics.

## Features

### User Features
- **User Registration & Authentication**: Secure login system with role-based access (Admin, User, Guest)
- **Profile Management**: Users can view and edit their profile information, including car details
- **Reservation Management**: 
  - Make reservations with 30-minute time increments
  - View upcoming reservations
  - Mark reservations as complete
  - Automatic expiration of past reservations
- **Charging Sessions**: 
  - Start charging sessions (linked to reservations or walk-in)
  - Automatic calculation of energy delivered and cost based on charger speed and station pricing
  - View session history
- **Dashboard**: Personalized dashboard showing:
  - Total reservations and upcoming reservations
  - Total sessions, spending, and energy delivered
  - Recent charging sessions
  - Available stations

### Admin Features
- **Station Management**: Create, read, update, and delete charging stations
- **Charger Management**: Manage chargers at each station
- **User Management**: View and manage all users
- **Reservation Management**: View, edit, and delete any reservation
- **Session Management**: View, edit, and delete any charging session
- **Status Management**: Change reservation and session statuses
- **Comprehensive Dashboard**: 
  - System-wide statistics (total stations, active stations, available chargers, total sessions, revenue)
  - Station utilization charts
  - Charger status summaries

### Reports & Analytics
- **Interactive Charts**: Visualize data using Chart.js
  - Station Utilization
  - Charger Status Summary
  - User Total Paid (Top 10)
  - Session Cost vs Rate Analysis
  - Station Vacancy
  - Operator Average Rates
  - Session Details Summary
  - Station Reliability
- **Data Export**: 
  - Export any view to CSV format
  - Export any view to PDF format
- **SQL Views**: Access to 14+ pre-built database views for analytics

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **Sequelize** ORM for database operations
- **bcryptjs** for password hashing
- **express-session** for session management

### Frontend
- **Vanilla JavaScript** (ES6+)
- **Chart.js** for data visualization
- **jsPDF** and **jsPDF-autotable** for PDF generation
- **HTML5/CSS3** for UI

### Database
- **MySQL** with relational database design
- Multiple SQL views for analytics
- Indexed tables for performance

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Databse-management-proj
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database named `ev_charging`
   - Run the SQL scripts in order:
     ```bash
     mysql -u root -p < ev_charging.sql
     mysql -u root -p < data.sql
     mysql -u root -p < all views combined.sql
     ```
   - Or import them using MySQL Workbench or phpMyAdmin

4. **Environment Configuration**
   - Create a `.env` file in the root directory:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=ev_charging
     PORT=3000
     ```

5. **Create Admin User**
   - Run the admin user creation script:
     ```bash
     mysql -u root -p < create_admin_user.sql
     ```
   - Or manually insert:
     ```sql
     INSERT INTO Users (fname, lname, email, password, role) 
     VALUES ('Admin', 'User', 'admin@example.com', 'admin123', 'admin');
     ```

6. **Start the Server**
   ```bash
   node index.js
   ```

7. **Access the Application**
   - Open your browser and navigate to: `http://localhost:3000`
   - Login with admin credentials or create a new user account

## Project Structure

```
Databse-management-proj/
├── backend/              # Backend server files
├── config/              # Database configuration
├── controllers/         # Request handlers
│   ├── reservationController.js
│   ├── sessionController.js
│   └── stationController.js
├── models/              # Sequelize models
│   ├── ChargingSession.js
│   ├── Reservation.js
│   ├── Station.js
│   └── Users.js
├── routes/              # API routes
│   ├── carRoutes.js
│   ├── exportRoutes.js
│   ├── loginRoutes.js
│   ├── reservationRoutes.js
│   ├── sessionRoutes.js
│   ├── stationRoutes.js
│   ├── userRoutes.js
│   └── viewRoutes.js
├── frontend/            # Frontend files
│   ├── api.js          # API client functions
│   ├── app.js          # Reports page logic
│   ├── dashboard.js    # Dashboard logic
│   ├── reservations.js # Reservations page logic
│   ├── sessions.js     # Sessions page logic
│   ├── stations.js     # Stations page logic
│   ├── navbar.js       # Navigation bar
│   ├── css.css         # Styles
│   ├── index.html      # Login page
│   ├── dashboard.html  # Dashboard page
│   ├── reservations.html
│   ├── sessions.html
│   ├── stations.html
│   └── views.html      # Reports page
├── ev_charging.sql     # Database schema
├── data.sql            # Sample data
├── all views combined.sql  # SQL views
├── index.js            # Main server file
└── package.json        # Dependencies
```

## Key Features Explained

### Reservation System
- **Time Selection**: 30-minute increments with custom time picker
- **Validation**: 
  - Prevents scheduling in the past
  - Ensures end time is after start time
  - Checks for scheduling conflicts based on station port capacity
- **Status Management**: 
  - Reserved (default)
  - Cancelled
  - Completed
  - Expired (automatic when end time passes)

### Charging Sessions
- **Automatic Calculations**: 
  - Energy delivered = (Duration in hours) × (Charger speed in kW)
  - Cost = (Energy × Rate) + (Duration × Stall time fee)
- **Reservation Linking**: Sessions can be linked to existing reservations
- **Walk-in Sessions**: Support for non-reserved charging sessions
- **Auto-completion**: Linked reservations automatically marked as "Completed" when session ends

### Reports & Analytics
The system includes 14+ SQL views for comprehensive analytics:
- `v_session_details` - Detailed session information
- `v_station_utilization` - Station usage statistics
- `v_charger_status_summary` - Charger availability by station
- `v_user_total_paid` - User spending totals
- `v_session_cost_vs_rate` - Cost analysis
- `v_station_vacancy` - Port availability
- `v_station_reliability` - Station uptime metrics
- And more...

## API Endpoints

### Authentication
- `POST /api/login/register` - Register new user
- `POST /api/login` - User login
- `POST /api/login/logout` - User logout

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Stations
- `GET /api/stations` - Get all stations
- `GET /api/stations/:id` - Get station by ID
- `POST /api/stations` - Create station (admin)
- `PUT /api/stations/:id` - Update station (admin)
- `DELETE /api/stations/:id` - Delete station (admin)

### Reservations
- `GET /api/reservations` - Get all reservations
- `GET /api/reservations/:id` - Get reservation by ID
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation

### Sessions
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Views
- `GET /api/views/:viewName` - Get data from SQL view

## Database Schema

### Main Tables
- **Users**: User accounts with roles (admin, user, guest)
- **Cars**: Vehicle information with connector types
- **Station**: Charging station locations and details
- **Charger**: Individual chargers at each station
- **Reservation**: Booking system for charging slots
- **ChargingSession**: Actual charging session records
- **Pricing**: Station pricing information

### Relationships
- Users → Cars (one-to-one)
- Station → Chargers (one-to-many)
- Users → Reservations (one-to-many)
- Chargers → Reservations (one-to-many)
- Users → Sessions (one-to-many)
- Chargers → Sessions (one-to-many)
- Reservations → Sessions (one-to-one, optional)

## Usage Examples

### Making a Reservation
1. Navigate to "Reservations" page
2. Select a charger
3. Choose date and time (30-minute increments)
4. System validates availability
5. Submit reservation

### Starting a Charging Session
1. Navigate to "Sessions" page
2. Optionally link to an existing reservation
3. Select charger, user, and time
4. System automatically calculates energy and cost
5. Submit session

### Viewing Reports
1. Navigate to "Reports" page
2. Select a view from dropdown
3. Click "Load View" to see data and charts
4. Export to CSV or PDF if needed

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Role-based access control (RBAC)
- Input validation on frontend and backend
- SQL injection prevention with Sequelize ORM

## Future Enhancements

Potential improvements for future versions:
- Real-time charger status updates
- Email notifications for reservations
- Payment gateway integration
- Mobile app support
- Advanced analytics and machine learning predictions
- Multi-language support

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` file credentials
- Ensure database `ev_charging` exists
- Check user permissions

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000

### Charts Not Displaying
- Check browser console for errors
- Verify Chart.js CDN is accessible
- Ensure data is loaded before rendering charts

## License

ISC

## Authors

Database Management System - Final Project

## Acknowledgments

Built as a comprehensive database management system project demonstrating full-stack development with Node.js, Express, MySQL, and modern web technologies.
