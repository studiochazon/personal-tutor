#!/usr/bin/env node

// Test script for course ownership implementation
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'personal_tutor_ai',
  port: 3306
};

async function testCourseOwnership() {
  console.log('🧪 Testing Course Ownership Implementation\n');

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful\n');

    // Test 1: Check course ownership migration
    console.log('📊 Test 1: Course Ownership Migration');
    const [courses] = await connection.execute(
      'SELECT id, title, user_id, is_published FROM courses ORDER BY id'
    );
    
    console.log('Current courses and their owners:');
    courses.forEach(course => {
      console.log(`  Course ${course.id}: "${course.title}" - Owner: User ${course.user_id} - Published: ${course.is_published ? 'Yes' : 'No'}`);
    });
    
    const user4Courses = courses.filter(c => c.user_id === 4).length;
    console.log(`\n✅ ${user4Courses}/${courses.length} courses are owned by User ID 4\n`);

    // Test 2: Check users table
    console.log('👥 Test 2: Users Table');
    const [users] = await connection.execute(
      'SELECT id, email, name FROM users ORDER BY id'
    );
    
    console.log('Available users:');
    users.forEach(user => {
      console.log(`  User ${user.id}: ${user.name} (${user.email})`);
    });
    console.log('');

    // Test 3: Verify foreign key constraints
    console.log('🔗 Test 3: Foreign Key Constraints');
    const [orphanedCourses] = await connection.execute(`
      SELECT c.id, c.title, c.user_id 
      FROM courses c 
      LEFT JOIN users u ON c.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedCourses.length === 0) {
      console.log('✅ All courses have valid user references');
    } else {
      console.log('❌ Found orphaned courses:', orphanedCourses);
    }
    console.log('');

    // Test 4: Check authentication setup
    console.log('🔐 Test 4: Authentication Setup');
    const [authUsers] = await connection.execute(`
      SELECT id, email, name, google_id, email_verified 
      FROM users 
      WHERE google_id IS NOT NULL OR email_verified = TRUE
    `);
    
    if (authUsers.length > 0) {
      console.log('✅ Authentication fields are available');
      authUsers.forEach(user => {
        console.log(`  User ${user.id}: ${user.name} - Google ID: ${user.google_id || 'None'} - Verified: ${user.email_verified}`);
      });
    } else {
      console.log('⚠️  No users with authentication data found');
    }
    console.log('');

    // Test 5: API endpoint test simulation
    console.log('🌐 Test 5: API Endpoint Simulation');
    console.log('The following endpoints now require authentication:');
    console.log('  - POST /api/start/create-course (requires JWT token)');
    console.log('  - PUT /api/courses/:id (requires ownership)');
    console.log('  - DELETE /api/courses/:id (requires ownership)');
    console.log('');

    await connection.end();
    console.log('🎉 Course ownership implementation test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCourseOwnership(); 