#!/usr/bin/env node

/**
 * Test script for Gemini + Google Search integration for YouTube Discovery
 */

// Use Node.js built-in fetch if available, otherwise use node-fetch
let fetch;
try {
    fetch = globalThis.fetch;
} catch (e) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
}

// Test configuration
const API_BASE_URL = 'http://localhost:5173';
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzU0MDI1MTgyLCJleHAiOjE3NTQ2Mjk5ODJ9.Jk5PyWEX75akK-C4CaKWxS6romfXBjvLBruUF9m23qw';

// Test data optimized for Google Search
const googleSearchTestRequest = {
    lessons: [
        {
            title: "Introduction to Machine Learning",
            topic: "Basic concepts and overview of machine learning",
            duration: 15,
            audience: "beginners"
        },
        {
            title: "Python Programming Basics",
            topic: "Learning Python programming fundamentals",
            duration: 20,
            audience: "beginners"
        },
        {
            title: "Data Analysis with Pandas",
            topic: "Using pandas library for data manipulation",
            duration: 25,
            audience: "intermediate"
        }
    ],
    courseTitle: "Introduction to Data Science",
    preferred_duration: 15,
    quality_preference: "educational",
    max_retries: 1,
    use_keyword_extraction: true,
    keyword_cloud: {
        primary_keywords: [
            "machine learning",
            "python programming",
            "data science",
            "pandas tutorial",
            "data analysis"
        ],
        secondary_keywords: [
            "artificial intelligence",
            "programming tutorial",
            "data manipulation",
            "python basics",
            "coding"
        ],
        long_tail_keywords: [
            "machine learning for beginners",
            "python programming tutorial",
            "pandas data analysis tutorial",
            "introduction to data science"
        ],
        video_search_terms: [
            "machine learning tutorial",
            "python programming course",
            "pandas tutorial",
            "data science basics",
            "python for data science"
        ],
        excluded_terms: [
            "advanced",
            "expert level",
            "complex mathematics"
        ]
    }
};

async function testGoogleSearchIntegration() {
    console.log('🔍 Testing Gemini + Google Search Integration');
    console.log('📚 Course: Introduction to Data Science');
    console.log('🎯 Provider: Gemini 2.5 Pro with Google Search grounding');
    console.log('📝 Lessons: 3 lessons covering popular educational topics');
    console.log('🔎 Expected: Real, current, available YouTube videos');
    console.log('=' .repeat(80));
    
    try {
        const startTime = Date.now();
        
        console.log('🚀 Making API request with Google Search enabled...');
        const response = await fetch(`${API_BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT}`
            },
            body: JSON.stringify(googleSearchTestRequest)
        });
        
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log(`✅ API Response received in ${duration}ms`);
        console.log('=' .repeat(80));
        
        // Display key information
        console.log(`🤖 Provider: ${result.provider || 'Unknown'}`);
        console.log(`🔍 Google Search: ${result.grounding_used ? '✅ Used' : '❌ Not used'}`);
        console.log(`📺 Videos found: ${result.videos?.length || 0} out of ${googleSearchTestRequest.lessons.length} requested`);
        console.log(`✨ Success: ${result.success ? 'Yes' : 'No'}`);
        
        if (result.cost_info) {
            console.log(`💰 Total Cost: $${result.cost_info.total_cost.toFixed(6)} (${result.cost_info.provider})`);
            console.log(`🔢 Tokens Used: ${result.cost_info.tokens_used.total_tokens} total`);
        }
        
        if (result.api_usage) {
            console.log(`⏱️  API Duration: ${result.api_usage.duration_ms}ms`);
            console.log(`🤖 Model Used: ${result.api_usage.model}`);
        }
        
        console.log('\n📹 Video Results with Google Search:');
        console.log('=' .repeat(80));
        
        if (result.videos?.length > 0) {
            const realVideos = [];
            const fallbackVideos = [];
            
            result.videos.forEach((video, index) => {
                const lesson = googleSearchTestRequest.lessons[video.lesson_index];
                console.log(`\n${index + 1}. Lesson ${video.lesson_index + 1}: ${lesson?.title || 'Unknown'}`);
                console.log(`   🎬 Title: ${video.video_title}`);
                console.log(`   🔗 URL: ${video.video_url || 'Not found'}`);
                console.log(`   ⏱️  Duration: ${Math.floor(video.video_duration / 60)}:${(video.video_duration % 60).toString().padStart(2, '0')}`);
                console.log(`   📊 Confidence: ${(video.confidence_score * 100).toFixed(1)}%`);
                console.log(`   📱 Platform: ${video.platform}`);
                
                if (video.was_replaced) {
                    console.log(`   ⚠️  Replaced: ${video.fallback_reason || 'Original video unavailable'}`);
                    fallbackVideos.push(video);
                } else {
                    realVideos.push(video);
                }
                
                // Check if this looks like a real video ID
                const videoId = video.video_url?.split('/embed/')[1];
                if (videoId && videoId !== 'PLACEHOLDER_ID' && videoId !== 'W6NZfCO5SIk') {
                    console.log(`   ✅ Looks like a real video ID: ${videoId}`);
                } else {
                    console.log(`   ❌ Fallback/placeholder video detected`);
                }
            });
            
            console.log('\n' + '=' .repeat(80));
            console.log('📊 GOOGLE SEARCH EFFECTIVENESS:');
            console.log(`✅ Real Videos Found: ${realVideos.length}/${googleSearchTestRequest.lessons.length}`);
            console.log(`🔄 Fallback Videos: ${fallbackVideos.length}`);
            console.log(`📈 Real Video Rate: ${((realVideos.length / googleSearchTestRequest.lessons.length) * 100).toFixed(1)}%`);
            
            if (realVideos.length > 0) {
                console.log('\n🎉 REAL VIDEOS FOUND VIA GOOGLE SEARCH:');
                realVideos.forEach((video, index) => {
                    const lesson = googleSearchTestRequest.lessons[video.lesson_index];
                    console.log(`${index + 1}. ${video.video_title}`);
                    console.log(`   📚 Lesson: ${lesson?.title}`);
                    console.log(`   🔗 ${video.video_url}`);
                    console.log(`   📊 Confidence: ${(video.confidence_score * 100)}%`);
                });
            }
            
        } else {
            console.log('❌ No videos found');
        }
        
        // Test success criteria
        const realVideoCount = result.videos?.filter(v => 
            !v.was_replaced && 
            v.video_url && 
            !v.video_url.includes('PLACEHOLDER_ID') &&
            v.video_url !== 'https://www.youtube.com/embed/W6NZfCO5SIk'
        ).length || 0;
        
        const successRate = realVideoCount / googleSearchTestRequest.lessons.length;
        const isSuccess = successRate >= 0.5; // At least 50% real videos
        
        console.log('\n' + '=' .repeat(80));
        if (isSuccess) {
            console.log('🎉 GOOGLE SEARCH INTEGRATION TEST PASSED!');
            console.log(`✅ Found ${realVideoCount} real videos (${(successRate * 100).toFixed(1)}% success rate)`);
            console.log('🔍 Google Search grounding is effectively finding real YouTube videos');
        } else {
            console.log('❌ GOOGLE SEARCH INTEGRATION TEST FAILED');
            console.log(`❌ Only found ${realVideoCount} real videos (${(successRate * 100).toFixed(1)}% success rate)`);
            console.log('🔍 Google Search may not be working as expected');
        }
        
        return isSuccess;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure your development server is running');
        console.log('   - Check that GEMINI_API_KEY is set in your .env file');
        console.log('   - Verify Google Search is enabled in YOUTUBE_DISCOVERY_CONFIG');
        console.log('   - Ensure your API has access to Google Search grounding');
        return false;
    }
}

// Run the test
console.log('🚀 Starting Gemini + Google Search Integration Test');
console.log(`📡 Testing against: ${API_BASE_URL}`);
console.log('');

testGoogleSearchIntegration().then(success => {
    console.log('\n' + '=' .repeat(80));
    if (success) {
        console.log('🌟 Google Search integration is working! Real videos found.');
    } else {
        console.log('💥 Google Search integration needs work. Check configuration.');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});