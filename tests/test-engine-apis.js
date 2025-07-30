#!/usr/bin/env node

/**
 * Test script for Engine APIs
 * Tests the new modular educational content creation APIs
 */

const jwt = require('jsonwebtoken');

// Configuration
const BASE_URL = 'http://localhost:5173'; // Development server
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Create test JWT token
const testUser = {
    userId: 1,
    email: 'test@example.com'
};

const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

// Common headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
};

/**
 * Test the lesson planning API
 */
async function testLessonPlanning() {
    console.log('\n🧠 Testing Lesson Planning API...');
    
    const requestBody = {
        topic: 'Introduction to Machine Learning',
        audience: 'beginner',
        depth: 'comprehensive',
        lessonCount: 5,
        duration: 90
    };

    try {
        const response = await fetch(`${BASE_URL}/api/engine/lesson_planning`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Lesson Planning API: SUCCESS');
            console.log(`   Generated ${data.lessons.length} lessons`);
            console.log(`   Total duration: ${data.total_duration} minutes`);
            console.log(`   First lesson: "${data.lessons[0].title}"`);
            console.log(`   Learning objectives: ${data.lessons[0].objectives.length}`);
            return data;
        } else {
            console.log('❌ Lesson Planning API: FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.log('❌ Lesson Planning API: ERROR');
        console.log(`   ${error.message}`);
        return null;
    }
}

/**
 * Test the content generation API
 */
async function testContentGeneration(lessonData) {
    console.log('\n📝 Testing Content Generation API...');
    
    if (!lessonData || !lessonData.lessons || lessonData.lessons.length === 0) {
        console.log('⚠️  Skipping Content Generation test - no lesson data available');
        return null;
    }

    const firstLesson = lessonData.lessons[0];
    const requestBody = {
        lesson_title: firstLesson.title,
        learning_objectives: firstLesson.objectives,
        topic: 'Introduction to Machine Learning',
        audience: 'beginner',
        format: 'markdown',
        duration: firstLesson.duration,
        include_examples: true,
        include_exercises: true,
        web_search: false
    };

    try {
        const response = await fetch(`${BASE_URL}/api/engine/content_generation`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Content Generation API: SUCCESS');
            console.log(`   Content length: ${data.generated_content.content.length} characters`);
            console.log(`   Examples: ${data.generated_content.examples.length}`);
            console.log(`   Exercises: ${data.generated_content.exercises.length}`);
            console.log(`   Key points: ${data.generated_content.key_points.length}`);
            console.log(`   Reading time: ${data.generated_content.estimated_reading_time} minutes`);
            return data;
        } else {
            console.log('❌ Content Generation API: FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.log('❌ Content Generation API: ERROR');
        console.log(`   ${error.message}`);
        return null;
    }
}

/**
 * Test the YouTube discovery API
 */
async function testYouTubeDiscovery(lessonData) {
    console.log('\n🎥 Testing YouTube Discovery API...');
    
    if (!lessonData || !lessonData.lessons || lessonData.lessons.length === 0) {
        console.log('⚠️  Skipping YouTube Discovery test - no lesson data available');
        return null;
    }

    const lessons = lessonData.lessons.slice(0, 3).map(lesson => ({
        title: lesson.title,
        topic: 'Introduction to Machine Learning',
        duration: lesson.duration,
        audience: 'beginner'
    }));

    const requestBody = {
        lessons,
        courseTitle: 'Introduction to Machine Learning',
        preferred_duration: 8,
        quality_preference: 'educational',
        max_retries: 2
    };

    try {
        const response = await fetch(`${BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ YouTube Discovery API: SUCCESS');
            console.log(`   Total lessons: ${data.total_lessons}`);
            console.log(`   Successful matches: ${data.successful_matches}`);
            console.log(`   Success rate: ${Math.round((data.successful_matches / data.total_lessons) * 100)}%`);
            
            const validVideos = data.videos.filter(v => v.video_url && !v.video_url.includes('null'));
            if (validVideos.length > 0) {
                console.log(`   First video: "${validVideos[0].video_title}"`);
                console.log(`   Confidence: ${validVideos[0].confidence_score}`);
            }
            return data;
        } else {
            console.log('❌ YouTube Discovery API: FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.log('❌ YouTube Discovery API: ERROR');
        console.log(`   ${error.message}`);
        return null;
    }
}

/**
 * Test the centralized LLM request API
 */
async function testLLMRequest() {
    console.log('\n🤖 Testing LLM Request API...');
    
    const requestBody = {
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful assistant. Respond with a simple JSON object.'
            },
            {
                role: 'user',
                content: 'Create a JSON object with a message saying "Hello from Engine API test" and a timestamp.'
            }
        ],
        context: 'Engine API Test',
        max_tokens: 100,
        temperature: 0.3
    };

    try {
        const response = await fetch(`${BASE_URL}/api/engine/llm_request`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ LLM Request API: SUCCESS');
            console.log(`   Model: ${data.model}`);
            console.log(`   Response length: ${data.response.length} characters`);
            console.log(`   Log ID: ${data.log_id}`);
            return data;
        } else {
            console.log('❌ LLM Request API: FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        console.log('❌ LLM Request API: ERROR');
        console.log(`   ${error.message}`);
        return null;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🚀 Starting Engine API Tests...');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`🔑 Using test JWT token for user: ${testUser.email}`);

    const results = {
        lessonPlanning: null,
        contentGeneration: null,
        youtubeDiscovery: null,
        llmRequest: null
    };

    // Test 1: Lesson Planning
    results.lessonPlanning = await testLessonPlanning();

    // Test 2: Content Generation (depends on lesson planning)
    results.contentGeneration = await testContentGeneration(results.lessonPlanning);

    // Test 3: YouTube Discovery (depends on lesson planning)
    results.youtubeDiscovery = await testYouTubeDiscovery(results.lessonPlanning);

    // Test 4: LLM Request (independent)
    results.llmRequest = await testLLMRequest();

    // Summary
    console.log('\n📊 Test Results Summary:');
    const successful = Object.values(results).filter(result => result !== null).length;
    const total = Object.keys(results).length;
    
    console.log(`✅ Successful: ${successful}/${total} APIs`);
    console.log(`❌ Failed: ${total - successful}/${total} APIs`);

    if (successful === total) {
        console.log('\n🎉 All Engine APIs are working correctly!');
        console.log('\n📖 Next steps:');
        console.log('   1. Try different combinations of APIs');
        console.log('   2. Experiment with different parameters');
        console.log('   3. Build custom workflows using multiple APIs');
        console.log('   4. Implement Phase 2 APIs (video_validation, prompt_engineering, etc.)');
    } else {
        console.log('\n⚠️  Some APIs failed. Check the logs above for details.');
        console.log('   Make sure the development server is running on port 5173');
        console.log('   Verify OpenAI API key is configured');
        console.log('   Check database connections if needed');
    }

    return results;
}

// Run tests if called directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testLessonPlanning,
    testContentGeneration,
    testYouTubeDiscovery,
    testLLMRequest
};