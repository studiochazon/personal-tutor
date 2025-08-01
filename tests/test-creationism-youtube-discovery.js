#!/usr/bin/env node

/**
 * Test script for YouTube Discovery API using Creationism keywords
 * Based on the creationism course plan with Gemini 2.5 Pro
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

// Creationism-based test data
const creationismTestRequest = {
    lessons: [
        {
            title: "Introduction to Creationism",
            topic: "Define creationism and its significance in religious and cultural contexts",
            duration: 30,
            audience: "general"
        },
        {
            title: "Historical Development of Creationist Beliefs",
            topic: "Historical progression of creationist beliefs from ancient times to present",
            duration: 45,
            audience: "general"
        },
        {
            title: "Forms of Creationism",
            topic: "Young Earth, Old Earth, Gap Creationism, Day-Age, Progressive Creationism",
            duration: 40,
            audience: "intermediate"
        },
        {
            title: "Theological Foundations of Creationist Beliefs",
            topic: "Scriptural interpretations and theological arguments",
            duration: 35,
            audience: "intermediate"
        },
        {
            title: "Scientific Critiques of Creationism",
            topic: "Scientific evidence supporting evolution and age of Earth",
            duration: 50,
            audience: "advanced"
        },
        {
            title: "Legal Battles and Educational Implications",
            topic: "Scopes Trial, Edwards v. Aguillard, teaching in schools",
            duration: 45,
            audience: "general"
        },
        {
            title: "Cultural and Societal Impacts",
            topic: "How creationism vs evolution debate influences society",
            duration: 40,
            audience: "general"
        },
        {
            title: "Contemporary Perspectives and Future Directions",
            topic: "Current trends, intelligent design, future developments",
            duration: 35,
            audience: "advanced"
        }
    ],
    courseTitle: "Understanding Creationism: Historical, Theological, and Scientific Perspectives",
    preferred_duration: 12, // 12 minutes average per video
    quality_preference: "educational",
    max_retries: 2,
    use_keyword_extraction: true,
    keyword_cloud: {
        primary_keywords: [
            "creationism",
            "young earth creationism",
            "old earth creationism",
            "intelligent design",
            "biblical creation",
            "creation science",
            "genesis",
            "theological perspectives",
            "religious beliefs",
            "scriptural interpretation"
        ],
        secondary_keywords: [
            "gap theory",
            "day-age theory",
            "progressive creationism",
            "creation vs evolution",
            "scopes trial",
            "edwards v aguillard",
            "scientific creationism",
            "literal interpretation",
            "biblical archaeology",
            "flood geology",
            "irreducible complexity",
            "fine-tuning argument",
            "apologetics",
            "christian theology",
            "religious education"
        ],
        long_tail_keywords: [
            "young earth creationism scientific evidence",
            "old earth creationism theology",
            "gap theory biblical interpretation",
            "day age theory genesis",
            "progressive creationism explained",
            "intelligent design movement history",
            "scopes monkey trial documentary",
            "creation science vs evolution debate",
            "biblical literalism and geology",
            "flood geology theory explained",
            "irreducible complexity examples",
            "fine tuning universe argument",
            "christian apologetics creation",
            "biblical creation account analysis",
            "creationism in public schools legal"
        ],
        video_search_terms: [
            "creationism explained",
            "young earth vs old earth",
            "intelligent design theory",
            "creation vs evolution debate",
            "biblical creation account",
            "scopes trial history",
            "creation science documentary",
            "christian theology creation",
            "gap theory explained",
            "day age theory bible",
            "progressive creationism",
            "biblical archaeology evidence",
            "flood geology theory",
            "irreducible complexity",
            "fine tuning argument",
            "religious education creation",
            "biblical literalism",
            "creation apologetics",
            "genesis interpretation",
            "theological perspectives creation"
        ],
        excluded_terms: [
            "atheist",
            "anti-religion",
            "debunked",
            "fake",
            "pseudoscience critique",
            "militant atheism",
            "religious mockery",
            "fundamentalist extremism"
        ]
    }
};

async function testCreationismYouTubeDiscovery() {
    console.log('🧪 Testing YouTube Discovery with Creationism Keywords');
    console.log('📚 Course: Understanding Creationism');
    console.log('🎯 Provider: Gemini 2.5 Pro');
    console.log('📝 Lessons: 8 lessons covering theological, historical, and scientific perspectives');
    console.log('🏷️  Keywords: 50+ creationism-related terms');
    console.log('=' .repeat(80));
    
    try {
        const startTime = Date.now();
        
        console.log('🚀 Making API request...');
        const response = await fetch(`${API_BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT}`
            },
            body: JSON.stringify(creationismTestRequest)
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
        console.log(`📺 Videos found: ${result.videos?.length || 0} out of ${creationismTestRequest.lessons.length} requested`);
        console.log(`✨ Success: ${result.success ? 'Yes' : 'No'}`);
        
        if (result.cost_info) {
            console.log(`💰 Total Cost: $${result.cost_info.total_cost.toFixed(6)} (${result.cost_info.provider})`);
            console.log(`   📊 Prompt Cost: $${result.cost_info.prompt_cost.toFixed(6)}`);
            console.log(`   📊 Completion Cost: $${result.cost_info.completion_cost.toFixed(6)}`);
            console.log(`🔢 Tokens Used: ${result.cost_info.tokens_used.total_tokens} total`);
            console.log(`   📝 Prompt: ${result.cost_info.tokens_used.prompt_tokens}`);
            console.log(`   💬 Completion: ${result.cost_info.tokens_used.completion_tokens}`);
        }
        
        if (result.api_usage) {
            console.log(`⏱️  API Duration: ${result.api_usage.duration_ms}ms`);
            console.log(`🤖 Model Used: ${result.api_usage.model}`);
        }
        
        console.log('\n📹 Video Results:');
        console.log('=' .repeat(80));
        
        if (result.videos?.length > 0) {
            result.videos.forEach((video, index) => {
                const lesson = creationismTestRequest.lessons[video.lesson_index];
                console.log(`\n${index + 1}. Lesson ${video.lesson_index + 1}: ${lesson?.title || 'Unknown'}`);
                console.log(`   🎬 Title: ${video.video_title}`);
                console.log(`   🔗 URL: ${video.video_url || 'Not found'}`);
                console.log(`   ⏱️  Duration: ${Math.floor(video.video_duration / 60)}:${(video.video_duration % 60).toString().padStart(2, '0')}`);
                console.log(`   📊 Confidence: ${(video.confidence_score * 100).toFixed(1)}%`);
                console.log(`   📱 Platform: ${video.platform}`);
                
                if (video.was_replaced) {
                    console.log(`   ⚠️  Replaced: ${video.fallback_reason || 'Original video unavailable'}`);
                }
            });
        } else {
            console.log('❌ No videos found');
        }
        
        // Summary
        console.log('\n' + '=' .repeat(80));
        console.log('📊 SUMMARY:');
        
        const validVideos = result.videos?.filter(v => v.video_url && v.video_url !== 'https://www.youtube.com/embed/PLACEHOLDER_ID') || [];
        const replacedVideos = result.videos?.filter(v => v.was_replaced) || [];
        
        console.log(`✅ Valid Videos: ${validVideos.length}/${creationismTestRequest.lessons.length}`);
        console.log(`🔄 Replaced Videos: ${replacedVideos.length}`);
        console.log(`💡 Success Rate: ${((validVideos.length / creationismTestRequest.lessons.length) * 100).toFixed(1)}%`);
        
        if (result.cost_info) {
            console.log(`💰 Cost per Video: $${(result.cost_info.total_cost / creationismTestRequest.lessons.length).toFixed(6)}`);
        }
        
        return validVideos.length >= Math.floor(creationismTestRequest.lessons.length * 0.7); // 70% success rate
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure your development server is running (npm run dev)');
        console.log('   - Check that GEMINI_API_KEY is set in your .env file');
        console.log('   - Verify the API endpoint is accessible');
        return false;
    }
}

// Run the test
console.log('🚀 Starting Creationism YouTube Discovery Test');
console.log(`📡 Testing against: ${API_BASE_URL}`);
console.log('');

testCreationismYouTubeDiscovery().then(success => {
    console.log('\n' + '=' .repeat(80));
    if (success) {
        console.log('🎉 Test PASSED! Gemini integration working correctly with creationism keywords.');
    } else {
        console.log('❌ Test FAILED! Check the output above for details.');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});