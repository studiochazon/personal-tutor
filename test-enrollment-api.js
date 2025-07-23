const fetch = require('node-fetch');

// Test the enrollment API endpoints
async function testEnrollmentAPI() {
  console.log('🧪 Testing Enrollment API Endpoints\n');
  
  const baseUrl = 'http://localhost:5173';
  
  try {
    // Test 1: Get all courses (should work without auth)
    console.log('1️⃣ Testing courses endpoint...');
    const coursesResponse = await fetch(`${baseUrl}/api/courses`);
    const coursesData = await coursesResponse.json();
    
    if (coursesResponse.ok && coursesData.courses && coursesData.courses.length > 0) {
      console.log(`✅ Found ${coursesData.courses.length} courses`);
      const firstCourse = coursesData.courses[0];
      console.log(`   First course: ${firstCourse.title} (ID: ${firstCourse.id})`);
    } else {
      console.log('❌ Failed to get courses');
      return;
    }
    
    // Test 2: Test enrollment endpoint without auth (should fail)
    console.log('\n2️⃣ Testing enrollment endpoint without auth...');
    const enrollResponse = await fetch(`${baseUrl}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ course_id: firstCourse.id })
    });
    
    if (enrollResponse.status === 401) {
      console.log('✅ Correctly rejected enrollment without authentication');
    } else {
      console.log(`❌ Expected 401, got ${enrollResponse.status}`);
    }
    
    // Test 3: Test progress endpoint without auth (should fail)
    console.log('\n3️⃣ Testing progress endpoint without auth...');
    const progressResponse = await fetch(`${baseUrl}/api/progress`);
    
    if (progressResponse.status === 401) {
      console.log('✅ Correctly rejected progress access without authentication');
    } else {
      console.log(`❌ Expected 401, got ${progressResponse.status}`);
    }
    
    console.log('\n🎉 API endpoint tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Log in with Google OAuth');
    console.log('3. Navigate to a course page');
    console.log('4. Click "Enroll in Course" button');
    console.log('5. Test the "Mark Complete" button on lesson pages');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   cd client && npm run dev');
  }
}

// Run the test
testEnrollmentAPI(); 