#!/usr/bin/env node

/**
 * Test script for improved YouTube Discovery API with enhanced validation
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

// Test with challenging topics that may not have videos
const improvedTestRequest = {
    lessons: [
        {
            title: "Advanced Quantum Mechanics for Toddlers",
            topic: "Teaching quantum physics concepts to 2-year-olds",
            duration: 30,
            audience: "toddlers"
        },
        {
            title: "Basic Python Programming",
            topic: "Introduction to Python programming for beginners",
            duration: 20,
            audience: "beginners"
        },
        {
            title: "Ancient Mesopotamian Tax Law",
            topic: "Detailed analysis of taxation systems in ancient Mesopotamia",
            duration: 45,
            audience: "graduate students"
        },
        {
            title: "Simple Math for Kids",
            topic: "Basic addition and subtraction for elementary students",
            duration: 15,
            audience: "children"
        }
    ],
    courseTitle: "Mixed Educational Topics Test",
    preferred_duration: 20,
    quality_preference: "educational",
    max_retries: 1,
    use_keyword_extraction: true,
    keyword_cloud: {
        primary_keywords: [
            "python programming",
            "basic math",
            "elementary education",
            "programming tutorial"
        ],
        secondary_keywords: [
            "coding",
            "mathematics",
            "education",
            "learning"
        ],
        long_tail_keywords: [
            "python programming tutorial for beginners",
            "basic math for kids",
            "simple programming concepts"
        ],
        video_search_terms: [
            "python tutorial",
            "math for kids",
            "programming basics",
            "elementary math"
        ],
        excluded_terms: [
            "advanced",
            "complex",
            "expert level"
        ]
    }
};

async function testImprovedYouTubeDiscovery() {
    console.log('🧪 Testing Improved YouTube Discovery API');
    console.log('📚 Course: Mixed Educational Topics (some impossible, some easy)');
    console.log('🎯 Goal: Test live verification, keyword relevance, and proper error handling');
    console.log('🔍 Expected: Real videos for possible topics, empty URLs with reasons for impossible ones');
    console.log('=' .repeat(80));
    
    try {
        const startTime = Date.now();
        
        console.log('🚀 Making API request with improved validation...');
        const response = await fetch(`${API_BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT}`
            },
            body: JSON.stringify(improvedTestRequest)
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
        console.log(`📺 Videos processed: ${result.videos?.length || 0} out of ${improvedTestRequest.lessons.length} requested`);
        console.log(`✨ Success: ${result.success ? 'Yes' : 'No'}`);
        
        console.log('\n📹 Enhanced Video Results:');
        console.log('=' .repeat(80));
        
        if (result.videos?.length > 0) {
            const realVideos = [];
            const emptyUrlsWithReasons = [];
            const fallbackVideos = [];
            
            result.videos.forEach((video, index) => {
                const lesson = improvedTestRequest.lessons[video.lesson_index];
                console.log(`\n${index + 1}. Lesson ${video.lesson_index + 1}: ${lesson?.title || 'Unknown'}`);
                console.log(`   🎬 Title: ${video.video_title}`);
                console.log(`   🔗 URL: ${video.video_url || 'EMPTY'}`);
                
                if (video.video_url && video.video_url !== '') {
                    console.log(`   ⏱️  Duration: ${Math.floor(video.video_duration / 60)}:${(video.video_duration % 60).toString().padStart(2, '0')}`);
                    console.log(`   📊 Confidence: ${(video.confidence_score * 100).toFixed(1)}%`);
                    console.log(`   📱 Platform: ${video.platform}`);
                    console.log(`   🔍 Verified Live: ${video.verified_live ? 'Yes' : 'No'}`);
                    
                    if (video.was_replaced) {
                        console.log(`   ⚠️  Replaced: ${video.fallback_reason || 'Original video unavailable'}`);
                        fallbackVideos.push(video);
                    } else {
                        realVideos.push(video);
                    }
                } else {
                    console.log(`   📝 Reason: ${video.reason || 'No reason provided'}`);
                    console.log(`   🔍 Verified Live: No (empty URL)`);
                    emptyUrlsWithReasons.push(video);
                }
            });
            
            console.log('\n' + '=' .repeat(80));
            console.log('📊 IMPROVED API ANALYSIS:');
            console.log(`✅ Real Videos Found: ${realVideos.length}`);
            console.log(`📝 Empty URLs with Reasons: ${emptyUrlsWithReasons.length}`);
            console.log(`🔄 Fallback Videos: ${fallbackVideos.length}`);
            console.log(`📈 Real Video Rate: ${((realVideos.length / improvedTestRequest.lessons.length) * 100).toFixed(1)}%`);
            
            if (realVideos.length > 0) {
                console.log('\n🎉 REAL VIDEOS FOUND:');
                realVideos.forEach((video, index) => {
                    const lesson = improvedTestRequest.lessons[video.lesson_index];
                    console.log(`${index + 1}. ${video.video_title}`);
                    console.log(`   📚 Lesson: ${lesson?.title}`);
                    console.log(`   🔗 ${video.video_url}`);
                    console.log(`   📊 Confidence: ${(video.confidence_score * 100)}% | Live: ${video.verified_live ? 'Yes' : 'No'}`);
                });
            }
            
            if (emptyUrlsWithReasons.length > 0) {
                console.log('\n📝 PROPER ERROR HANDLING (Empty URLs with Reasons):');
                emptyUrlsWithReasons.forEach((video, index) => {
                    const lesson = improvedTestRequest.lessons[video.lesson_index];
                    console.log(`${index + 1}. ${lesson?.title}`);
                    console.log(`   📝 Reason: ${video.reason}`);
                    console.log(`   💡 This is GOOD - proper handling of impossible requests!`);
                });
            }
            
        } else {
            console.log('❌ No videos found');
        }
        
        // Enhanced success criteria
        const realVideoCount = result.videos?.filter(v => v.video_url && v.video_url !== '').length || 0;
        const reasonableRequests = improvedTestRequest.lessons.filter(lesson => 
            lesson.title.includes('Python') || lesson.title.includes('Math')
        ).length;
        
        const properErrorHandling = result.videos?.filter(v => !v.video_url && v.reason).length || 0;
        
        console.log('\n' + '=' .repeat(80));
        console.log('🎯 ENHANCED VALIDATION RESULTS:');
        console.log(`✅ Real videos for reasonable requests: ${realVideoCount}/${reasonableRequests}`);
        console.log(`📝 Proper error handling (impossible requests): ${properErrorHandling}`);
        console.log(`🔍 Live verification working: ${result.videos?.some(v => v.verified_live) ? 'Yes' : 'No'}`);
        console.log(`🏷️  Keyword relevance: ${result.videos?.some(v => v.confidence_score > 0.7) ? 'High' : 'Low'}`);
        
        const overallSuccess = (realVideoCount >= 1 && properErrorHandling >= 1);
        
        if (overallSuccess) {
            console.log('\n🌟 ENHANCED API TEST PASSED!');
            console.log('✅ Found real videos for possible topics');
            console.log('✅ Properly handled impossible requests with reasons');
            console.log('✅ Improved validation working correctly');
        } else {
            console.log('\n❌ ENHANCED API TEST NEEDS IMPROVEMENT');
            console.log('💡 Check if live verification and reason handling are working');
        }
        
        return overallSuccess;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure your development server is running');
        console.log('   - Check that the improved prompt is being used');
        console.log('   - Verify Google Search integration is working');
        return false;
    }
}

// Run the test
console.log('🚀 Starting Enhanced YouTube Discovery Test');
console.log(`📡 Testing against: ${API_BASE_URL}`);
console.log('');

testImprovedYouTubeDiscovery().then(success => {
    console.log('\n' + '=' .repeat(80));
    if (success) {
        console.log('🎉 Enhanced validation features are working properly!');
    } else {
        console.log('⚠️  Enhanced features need refinement.');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});