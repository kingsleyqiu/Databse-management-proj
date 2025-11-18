require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateAdminPassword() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database');
    
    // Hash the password
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log('Password hashed successfully');
    
    // Update the admin user's password
    const [result] = await connection.query(
      'UPDATE Users SET password = ? WHERE user_id = 0 AND email = ?',
      [hashedPassword, 'admin@example.com']
    );
    
    if (result.affectedRows === 0) {
      console.log('⚠️  No admin user found with user_id = 0 and email = admin@example.com');
    } else {
      console.log('✅ Admin password updated successfully!');
      console.log('Admin login credentials:');
      console.log('  - email: admin@example.com');
      console.log('  - password: admin123');
      console.log('  - user_id: 0');
      console.log('  - role: admin');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

updateAdminPassword();

