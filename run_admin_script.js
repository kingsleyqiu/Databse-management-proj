require('dotenv').config();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function runAdminScript() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true // Allow multiple SQL statements
    });

    console.log('Connected to database');
    
    // Read the SQL file
    const sql = fs.readFileSync('create_admin_user.sql', 'utf8');
    
    // Execute the SQL script
    console.log('Running admin user creation script...');
    await connection.query(sql);
    
    // Hash the password and update the admin user
    console.log('Hashing password...');
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // Update the admin user's password with the hashed version
    const [result] = await connection.query(
      'UPDATE Users SET password = ? WHERE user_id = 0 AND email = ?',
      [hashedPassword, 'admin@example.com']
    );
    
    if (result.affectedRows === 0) {
      console.log('⚠️  Warning: Admin user may not have been created or updated');
    } else {
      console.log('✅ Admin user created successfully with hashed password!');
      console.log('Admin user details:');
      console.log('  - user_id: 0');
      console.log('  - email: admin@example.com');
      console.log('  - password: admin123 (hashed)');
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

runAdminScript();

