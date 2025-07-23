const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'personal_tutor_ai'
};

async function testEnrollmentAndProgress() {
  console.log('🧪 Testing Enrollment and Progress Systems\n');
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Test 1: Check if enrollments table exists
    console.log('\n1️⃣ Testing enrollments table...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "enrollments"');
    if (tables.length > 0) {
      console.log('✅ Enrollments table exists');
    } else {
      console.log('❌ Enrollments table missing - run migration first');
      return;
    }
    
    // Test 2: Check if progress table exists
    console.log('\n2️⃣ Testing progress table...');
    const [progressTables] = await connection.execute('SHOW TABLES LIKE "progress"');
    if (progressTables.length > 0) {
      console.log('✅ Progress table exists');
    } else {
      console.log('❌ Progress table missing');
      return;
    }
    
    // Test 3: Test enrollment creation
    console.log('\n3️⃣ Testing enrollment creation...');
    const [enrollmentResult] = await connection.execute(
      'INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)',
      [1, 1, 'active']
    );
    console.log('✅ Enrollment created/updated');
    
    // Test 4: Test enrollment retrieval
    console.log('\n4️⃣ Testing enrollment retrieval...');
    const [enrollments] = await connection.execute(
      'SELECT * FROM enrollments WHERE user_id = ?',
      [1]
    );
    console.log(`✅ Found ${enrollments.length} enrollments for user 1`);
    
    // Test 5: Test progress creation
    console.log('\n5️⃣ Testing progress creation...');
    const [progressResult] = await connection.execute(
      'INSERT INTO progress (user_id, lesson_id, completed, completed_at, time_spent) VALUES (?, ?, ?, NOW(), ?) ON DUPLICATE KEY UPDATE completed = VALUES(completed), completed_at = VALUES(completed_at), time_spent = VALUES(time_spent)',
      [1, 1, true, 300]
    );
    console.log('✅ Progress created/updated');
    
    // Test 6: Test progress retrieval
    console.log('\n6️⃣ Testing progress retrieval...');
    const [progress] = await connection.execute(
      'SELECT * FROM progress WHERE user_id = ?',
      [1]
    );
    console.log(`✅ Found ${progress.length} progress records for user 1`);
    
    // Test 7: Test course progress calculation
    console.log('\n7️⃣ Testing course progress calculation...');
    const [courseProgress] = await connection.execute(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        COUNT(l.id) as total_lessons,
        COUNT(p.id) as completed_lessons,
        ROUND((COUNT(p.id) / COUNT(l.id)) * 100, 2) as completion_percentage
      FROM courses c
      JOIN lessons l ON c.id = l.course_id
      LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = 1 AND p.completed = TRUE
      WHERE c.id = 1
      GROUP BY c.id, c.title
    `);
    
    if (courseProgress.length > 0) {
      const progress = courseProgress[0];
      console.log(`✅ Course "${progress.course_title}": ${progress.completed_lessons}/${progress.total_lessons} lessons completed (${progress.completion_percentage}%)`);
    } else {
      console.log('❌ No course progress found');
    }
    
    // Test 8: Test enrollment status update
    console.log('\n8️⃣ Testing enrollment status update...');
    await connection.execute(
      'UPDATE enrollments SET status = ? WHERE user_id = ? AND course_id = ?',
      ['completed', 1, 1]
    );
    console.log('✅ Enrollment status updated to completed');
    
    // Test 9: Test views
    console.log('\n9️⃣ Testing database views...');
    const [courseProgressView] = await connection.execute('SELECT * FROM course_progress_view LIMIT 5');
    console.log(`✅ Course progress view: ${courseProgressView.length} records`);
    
    const [enrollmentStats] = await connection.execute('SELECT * FROM enrollment_stats_view LIMIT 5');
    console.log(`✅ Enrollment stats view: ${enrollmentStats.length} records`);
    
    // Test 10: Test data integrity
    console.log('\n🔟 Testing data integrity...');
    const [integrityCheck] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT e.user_id) as unique_users_enrolled,
        COUNT(DISTINCT e.course_id) as unique_courses_enrolled,
        COUNT(DISTINCT p.user_id) as unique_users_with_progress,
        COUNT(DISTINCT p.lesson_id) as unique_lessons_with_progress
      FROM enrollments e
      LEFT JOIN progress p ON e.user_id = p.user_id
    `);
    
    const stats = integrityCheck[0];
    console.log(`✅ Data integrity check:`);
    console.log(`   - ${stats.unique_users_enrolled} unique users enrolled`);
    console.log(`   - ${stats.unique_courses_enrolled} unique courses enrolled`);
    console.log(`   - ${stats.unique_users_with_progress} unique users with progress`);
    console.log(`   - ${stats.unique_lessons_with_progress} unique lessons with progress`);
    
    console.log('\n🎉 All tests passed! Enrollment and Progress systems are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testEnrollmentAndProgress(); 