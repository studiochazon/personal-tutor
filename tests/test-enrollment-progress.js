const mysql = require('mysql2/promise');

// Load environment variables if .env exists
try {
  require('dotenv').config({ path: './client/.env' });
} catch (e) {
  console.log('No .env file found, using defaults');
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_tutor_ai',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function testEnrollmentAndProgress() {
  let connection;
  
  try {
    console.log('🔍 Testing Enrollment and Progress System...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // 1. Check if we have users
    const [users] = await connection.execute('SELECT id, name, email FROM users LIMIT 3');
    console.log(`📊 Found ${users.length} users:`, users.map(u => `${u.name} (${u.email})`));
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create some users first.');
      return;
    }
    
    // 2. Check if we have published courses
    const [courses] = await connection.execute('SELECT id, title, is_published FROM courses WHERE is_published = true LIMIT 3');
    console.log(`📚 Found ${courses.length} published courses:`, courses.map(c => `${c.title} (ID: ${c.id})`));
    
    if (courses.length === 0) {
      console.log('❌ No published courses found. Please publish some courses first.');
      return;
    }
    
    // 3. Check existing enrollments
    const [enrollments] = await connection.execute(`
      SELECT e.*, u.name as user_name, c.title as course_title 
      FROM enrollments e 
      JOIN users u ON e.user_id = u.id 
      JOIN courses c ON e.course_id = c.id 
      LIMIT 5
    `);
    console.log(`🎓 Found ${enrollments.length} existing enrollments:`, enrollments.map(e => 
      `${e.user_name} → ${e.course_title} (${e.status})`
    ));
    
    // 4. Check existing progress
    const [progress] = await connection.execute(`
      SELECT p.*, u.name as user_name, c.title as course_title, l.title as lesson_title
      FROM progress p 
      JOIN users u ON p.user_id = u.id 
      JOIN lessons l ON p.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      LIMIT 5
    `);
    console.log(`📈 Found ${progress.length} progress records:`, progress.map(p => 
      `${p.user_name} completed "${p.lesson_title}" in "${p.course_title}"`
    ));
    
    // 5. Test the in-progress query (simulate the API endpoint)
    if (users.length > 0 && courses.length > 0) {
      const userId = users[0].id;
      const courseId = courses[0].id;
      
      console.log(`\n🧪 Testing in-progress query for user ${users[0].name} (ID: ${userId})...`);
      
      const [inProgressResults] = await connection.execute(`
        SELECT 
          c.*,
          e.status as enrollment_status,
          e.enrolled_at,
          e.completed_at as enrollment_completed_at,
          COUNT(l.id) as total_lessons,
          COUNT(p.id) as completed_lessons,
          CASE 
            WHEN COUNT(l.id) = 0 THEN 0
            ELSE ROUND((COUNT(p.id) / COUNT(l.id)) * 100, 2)
          END as progress_percentage
        FROM courses c
        INNER JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN lessons l ON c.id = l.course_id
        LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = ? AND p.completed = true
        WHERE e.user_id = ? AND c.is_published = true
        GROUP BY c.id, c.title, c.description, c.thumbnail_url, c.difficulty, 
                 c.estimated_duration, c.owned_by, c.is_published, c.created_at, 
                 c.updated_at, e.status, e.enrolled_at, e.completed_at
        ORDER BY e.enrolled_at DESC
      `, [userId, userId]);
      
      console.log(`📊 In-progress courses for ${users[0].name}:`, inProgressResults.map(c => ({
        title: c.title,
        enrollment_status: c.enrollment_status,
        progress_percentage: c.progress_percentage,
        total_lessons: c.total_lessons,
        completed_lessons: c.completed_lessons
      })));
    }
    
    // 6. Show database schema summary
    console.log('\n📋 Database Schema Summary:');
    const [tables] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'personal_tutor_ai'
      ORDER BY TABLE_NAME
    `);
    
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} rows`);
    });
    
    console.log('\n✅ Enrollment and Progress System Test Complete!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testEnrollmentAndProgress(); 