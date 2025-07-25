#!/usr/bin/env node

// Test database connection
const mysql = require('mysql2/promise');

// Load environment variables if .env exists
try {
  require('dotenv').config({ path: './client/.env' });
} catch (e) {
  console.log('No .env file found, using defaults');
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_tutor_ai',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    password: dbConfig.password ? '[HIDDEN]' : '[EMPTY]'
  });

  try {
    // Test connection without database first
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    console.log('✅ MySQL connection successful');

    // Check if database exists
    const [rows] = await connection.execute('SHOW DATABASES LIKE ?', [dbConfig.database]);
    
    if (rows.length === 0) {
      console.log('⚠️  Database does not exist, creating...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log('✅ Database created');
    } else {
      console.log('✅ Database exists');
    }

    // Connect to the specific database
    await connection.execute(`USE ${dbConfig.database}`);

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. Please run the setup script:');
      console.log('   ./setup-database.sh');
    } else {
      console.log('✅ Tables found:', tables.map(t => Object.values(t)[0]).join(', '));
      
      // Check table counts
      const [courseCount] = await connection.execute('SELECT COUNT(*) as count FROM courses');
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      const [lessonCount] = await connection.execute('SELECT COUNT(*) as count FROM lessons');
      
      console.log('📊 Database Statistics:');
      console.log(`   - Users: ${userCount[0].count}`);
      console.log(`   - Courses: ${courseCount[0].count}`);
      console.log(`   - Lessons: ${lessonCount[0].count}`);
    }

    await connection.end();
    console.log('✅ Database connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solution: Check your database credentials');
      console.log('   1. Create a .env file in the client directory');
      console.log('   2. Add your MySQL password: DB_PASSWORD=your_password');
      console.log('   3. Or create a new MySQL user with proper permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: MySQL server is not running');
      console.log('   Start MySQL service and try again');
    }
    
    process.exit(1);
  }
}

testConnection(); 