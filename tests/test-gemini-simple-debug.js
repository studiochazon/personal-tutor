#!/usr/bin/env node

/**
 * Simple debug test for Gemini API response structure
 */

// Use Node.js built-in fetch if available
let fetch;
try {
    fetch = globalThis.fetch;
} catch (e) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
}

const API_BASE_URL = 'http://localhost:5173';
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzU0MDI1MTgyLCJleHAiOjE3NTQ2Mjk5ODJ9.Jk5PyWEX75akK-C4CaKWxS6romfXBjvLBruUF9m23qw';

const simpleTest = {
    lessons: [
        {
            title: "Python Programming Basics",
            topic: "Introduction to Python programming",
            duration: 20,
            audience: "beginners"
        }
    ],
    courseTitle: "Simple Python Course",
    preferred_duration: 20,
    quality_preference: "educational",
    max_retries: 1,
    use_keyword_extraction: true,
    keyword_cloud: {
        primary_keywords: ["python", "programming"],
        secondary_keywords: ["coding", "tutorial"],
        long_tail_keywords: ["python programming tutorial"],
        video_search_terms: ["python tutorial"],
        excluded_terms: ["advanced"]
    }
};

async function testGeminiDebug() {
    console.log('🔍 Testing Gemini Response Structure');
    console.log('🎯 Simple test with one Python lesson');
    console.log('=' .repeat(60));
    
    try {
        console.log('🚀 Making simple API request...');
        const response = await fetch(`${API_BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT}`
            },
            body: JSON.stringify(simpleTest)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log('✅ API Response received');
        console.log('📊 Result structure:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Videos: ${result.videos?.length || 0}`);
        console.log(`   Provider: ${result.provider || 'Unknown'}`);
        
        if (result.videos && result.videos.length > 0) {
            const video = result.videos[0];
            console.log('\n📹 First video result:');
            console.log(`   Title: ${video.video_title}`);
            console.log(`   URL: ${video.video_url || 'EMPTY'}`);
            console.log(`   Verified Live: ${video.verified_live}`);
            console.log(`   Confidence: ${video.confidence_score}`);
            console.log(`   Reason: ${video.reason || 'None'}`);
            
            if (video.video_url && video.video_url !== '') {
                console.log('✅ Got a real video URL - Gemini working!');
            } else {
                console.log('📝 Empty URL - check if reason is provided');
            }
        } else {
            console.log('❌ No videos in response');
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        console.log('\n🔧 This will help debug the Gemini response structure issue');
        return false;
    }
}

// Run the debug test
testGeminiDebug().then(success => {
    console.log('\n' + '=' .repeat(60));
    if (success) {
        console.log('🎉 Debug test completed - check logs for Gemini response structure');
    } else {
        console.log('⚠️  Debug test shows parsing issues');
    }
}).catch(error => {
    console.error('💥 Debug test failed:', error);
});