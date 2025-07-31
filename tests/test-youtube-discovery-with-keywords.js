#!/usr/bin/env node

/**
 * Test the enhanced YouTube discovery API with keyword extraction
 * Demonstrates how to use keyword cloud for better video discovery
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    apiUrl: process.env.API_URL || 'http://localhost:5173',
    jwtToken: process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzUzOTM3OTAxLCJleHAiOjE3NTQ1NDI3MDF9.1s46nONej8-vASxEhAT-hToYrQJQs7qsj03EQDUwx-M',
};

// Sample lessons for testing
const testLessons = [
    {
        title: "Introduction to Creationism",
        topic: "creationism basics",
        duration: 30,
        audience: "intermediate"
    },
    {
        title: "Historical Development of Creationist Beliefs", 
        topic: "creationism history",
        duration: 45,
        audience: "intermediate"
    },
    {
        title: "Forms of Creationism",
        topic: "types of creationism",
        duration: 40,
        audience: "intermediate"
    }
];

// Sample keyword cloud (from your creationism course)
const sampleKeywordCloud = {
    primary_keywords: [
        "creationism",
        "intelligent design", 
        "young earth creationism",
        "old earth creationism",
        "theological foundations",
        "evolution debate",
        "scientific critique"
    ],
    secondary_keywords: [
        "gap creationism",
        "day-age creationism", 
        "progressive creationism",
        "scriptural interpretation",
        "edwards v aguillard",
        "scopes trial",
        "legal battles",
        "cultural impact"
    ],
    long_tail_keywords: [
        "introduction to creationism",
        "history of creationist beliefs",
        "types of creationism explained",
        "creationism vs evolution debate",
        "teaching creationism in schools"
    ],
    video_search_terms: [
        "creationism explained",
        "creationism tutorial",
        "young earth creationism explained",
        "creation vs evolution explained",
        "biblical creation explained"
    ],
    excluded_terms: [
        "atheism",
        "geology", 
        "paleontology"
    ]
};

async function makeRequest(url, options) {
    // Handle fetch for different Node.js versions
    let fetch;
    
    if (global.fetch) {
        fetch = global.fetch;
    } else if (typeof require !== 'undefined') {
        try {
            fetch = require('node-fetch');
        } catch (e) {
            if (typeof globalThis.fetch !== 'undefined') {
                fetch = globalThis.fetch;
            } else {
                throw new Error('No fetch implementation available. Use Node.js 18+ or install node-fetch.');
            }
        }
    }

    return fetch(url, options);
}

async function testYouTubeDiscoveryWithKeywords() {
    console.log('🧪 Testing Enhanced YouTube Discovery with Keywords\n');
    
    const startTime = Date.now();
    
    try {
        console.log('📋 Test Configuration:');
        console.log(`   API URL: ${config.apiUrl}`);
        console.log(`   JWT Token: ${config.jwtToken.substring(0, 20)}...`);
        console.log(`   Lessons: ${testLessons.length}`);
        console.log(`   Keywords: ${sampleKeywordCloud.primary_keywords.length} primary, ${sampleKeywordCloud.video_search_terms.length} video terms\n`);

        // Test 1: Without keyword extraction (original method)
        console.log('🔍 Test 1: YouTube Discovery WITHOUT Keywords');
        console.log('='.repeat(50));
        
        const requestWithoutKeywords = {
            lessons: testLessons,
            courseTitle: "Understanding Creationism",
            preferred_duration: 8,
            quality_preference: "educational",
            max_retries: 2,
            use_keyword_extraction: false
        };

        const response1 = await makeRequest(`${config.apiUrl}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.jwtToken}`
            },
            body: JSON.stringify(requestWithoutKeywords)
        });

        if (!response1.ok) {
            const errorText = await response1.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const result1 = await response1.json();
        
        if (!result1.success) {
            console.error('❌ API returned failure:', result1.error);
            return;
        }

        console.log(`✅ Found ${result1.successful_matches}/${result1.total_lessons} videos`);
        console.log(`   Response Time: ${Date.now() - startTime}ms`);
        
        result1.videos.forEach((video, i) => {
            console.log(`   ${i + 1}. ${video.video_title} (${video.confidence_score.toFixed(2)})`);
        });

        // Test 2: With keyword extraction (enhanced method)
        console.log('\n🔍 Test 2: YouTube Discovery WITH Keywords');
        console.log('='.repeat(50));
        
        const requestWithKeywords = {
            lessons: testLessons,
            courseTitle: "Understanding Creationism",
            preferred_duration: 8,
            quality_preference: "educational",
            max_retries: 2,
            use_keyword_extraction: true,
            keyword_cloud: sampleKeywordCloud
        };

        const response2 = await makeRequest(`${config.apiUrl}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.jwtToken}`
            },
            body: JSON.stringify(requestWithKeywords)
        });

        if (!response2.ok) {
            const errorText = await response2.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const result2 = await response2.json();
        
        if (!result2.success) {
            console.error('❌ API returned failure:', result2.error);
            return;
        }

        console.log(`✅ Found ${result2.successful_matches}/${result2.total_lessons} videos`);
        console.log(`   Response Time: ${Date.now() - startTime}ms`);
        
        result2.videos.forEach((video, i) => {
            console.log(`   ${i + 1}. ${video.video_title} (${video.confidence_score.toFixed(2)})`);
        });

        // Comparison
        console.log('\n📊 Comparison Results:');
        console.log('='.repeat(50));
        console.log(`Without Keywords: ${result1.successful_matches}/${result1.total_lessons} videos`);
        console.log(`With Keywords:    ${result2.successful_matches}/${result2.total_lessons} videos`);
        
        const avgConfidence1 = result1.videos.reduce((sum, v) => sum + v.confidence_score, 0) / result1.videos.length;
        const avgConfidence2 = result2.videos.reduce((sum, v) => sum + v.confidence_score, 0) / result2.videos.length;
        
        console.log(`Avg Confidence - Without: ${avgConfidence1.toFixed(2)}, With: ${avgConfidence2.toFixed(2)}`);
        
        if (avgConfidence2 > avgConfidence1) {
            console.log('🎉 Keywords improved video relevance!');
        } else {
            console.log('📝 Keywords had similar or lower relevance');
        }

        console.log('\n💡 How Keywords Help:');
        console.log('   • Primary keywords guide topic selection');
        console.log('   • Video search terms optimize for video discovery');
        console.log('   • Excluded terms avoid irrelevant content');
        console.log('   • Long-tail keywords find specific content');

    } catch (error) {
        console.error('\n❌ Test Failed:');
        console.error(`   Error: ${error.message}`);
        
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Ensure server is running: npm run dev');
        console.log('   2. Check OpenAI API key is configured');
        console.log('   3. Verify JWT token is valid');
        
        process.exit(1);
    }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Enhanced YouTube Discovery API Test\n');
    console.log('Usage:');
    console.log('   node test-youtube-discovery-with-keywords.js\n');
    console.log('Environment Variables:');
    console.log('   API_URL    - API base URL (default: http://localhost:5173)');
    console.log('   JWT_TOKEN  - JWT authentication token\n');
    console.log('What it tests:');
    console.log('   • YouTube discovery WITHOUT keyword extraction');
    console.log('   • YouTube discovery WITH keyword extraction');
    console.log('   • Compares results and confidence scores');
    process.exit(0);
}

// Run the test
console.log('Starting test in 1 second...\n');
setTimeout(testYouTubeDiscoveryWithKeywords, 1000); 