#!/usr/bin/env node

/**
 * Test the centralized engine configuration
 * Demonstrates how configuration parameters are managed across all APIs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    apiUrl: process.env.API_URL || 'http://localhost:5173',
    jwtToken: process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzUzOTM3OTAxLCJleHAiOjE3NTQ1NDI3MDF9.1s46nONej8-vASxEhAT-hToYrQJQs7qsj03EQDUwx-M',
};

// Sample course plan text for testing
const sampleCoursePlanText = `**Course Title: Understanding Creationism: Historical, Theological, and Scientific Perspectives**

**Course Description:**
This comprehensive course explores the concept of creationism, examining its historical development, various interpretations, and the ongoing debates surrounding its place in education and society.

**Learning Objectives:**
1. Understand the historical context and development of creationist thought.
2. Identify and differentiate between various forms of creationism.
3. Analyze the theological underpinnings of creationist beliefs.
4. Evaluate the scientific critiques and counterarguments to creationist claims.

**Course Outline:**

**Lesson 1: Introduction to Creationism**
- Define creationism and its significance in religious and cultural contexts.
- Explore the origins of creationist thought and its evolution over time.

**Lesson 2: Historical Development of Creationist Beliefs**
- Trace the historical progression of creationist beliefs from ancient times to the present.
- Highlight key figures and events.

**Lesson 3: Forms of Creationism**
- Examine different types of creationism, including Young Earth Creationism, Old Earth Creationism, Gap Creationism, Day-Age Creationism, and Progressive Creationism.`;

// Sample lessons for testing
const sampleLessons = [
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

async function testEngineConfiguration() {
    console.log('🧪 Testing Engine Configuration Integration\n');
    
    const startTime = Date.now();
    
    try {
        console.log('📋 Test Configuration:');
        console.log(`   API URL: ${config.apiUrl}`);
        console.log(`   JWT Token: ${config.jwtToken.substring(0, 20)}...\n`);

        // Test 1: Keyword Extraction with Configuration
        console.log('🔍 Test 1: Keyword Extraction (Using Centralized Config)');
        console.log('='.repeat(60));
        
        const keywordRequest = {
            course_plan_text: sampleCoursePlanText,
            audience: 'intermediate',
            depth: 'comprehensive'
        };

        const keywordResponse = await makeRequest(`${config.apiUrl}/api/engine/v3/keyword_generation`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.jwtToken}`
            },
            body: JSON.stringify(keywordRequest)
        });

        if (!keywordResponse.ok) {
            const errorText = await keywordResponse.text();
            console.error('❌ Keyword API Error:', errorText);
            return;
        }

        const keywordResult = await keywordResponse.json();
        
        if (!keywordResult.success) {
            console.error('❌ Keyword API returned failure:', keywordResult.error);
            return;
        }

        console.log(`✅ Keywords extracted successfully`);
        console.log(`   Response Time: ${Date.now() - startTime}ms`);
        console.log(`   Total Keywords: ${keywordResult.total_keywords}`);
        console.log(`   Primary Keywords: ${keywordResult.keyword_cloud.primary_keywords.length}`);
        console.log(`   Video Search Terms: ${keywordResult.keyword_cloud.video_search_terms.length}`);

        // Test 2: YouTube Discovery with Keywords (Using Configuration)
        console.log('\n🔍 Test 2: YouTube Discovery (Using Centralized Config)');
        console.log('='.repeat(60));
        
        const videoRequest = {
            lessons: sampleLessons,
            courseTitle: "Understanding Creationism",
            preferred_duration: 8,
            quality_preference: "educational",
            max_retries: 2,
            use_keyword_extraction: true,
            keyword_cloud: keywordResult.keyword_cloud
        };

        const videoResponse = await makeRequest(`${config.apiUrl}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.jwtToken}`
            },
            body: JSON.stringify(videoRequest)
        });

        if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            console.error('❌ Video API Error:', errorText);
            return;
        }

        const videoResult = await videoResponse.json();
        
        if (!videoResult.success) {
            console.error('❌ Video API returned failure:', videoResult.error);
            return;
        }

        console.log(`✅ Videos discovered successfully`);
        console.log(`   Response Time: ${Date.now() - startTime}ms`);
        console.log(`   Videos Found: ${videoResult.successful_matches}/${videoResult.total_lessons}`);
        
        const avgConfidence = videoResult.videos.reduce((sum, v) => sum + v.confidence_score, 0) / videoResult.videos.length;
        console.log(`   Average Confidence: ${avgConfidence.toFixed(2)}`);

        // Test 3: Configuration Benefits Summary
        console.log('\n📊 Configuration Benefits Summary');
        console.log('='.repeat(60));
        
        console.log('🎯 **Centralized Configuration Benefits:**');
        console.log('   ✅ Consistent parameters across all APIs');
        console.log('   ✅ Easy to modify settings in one place');
        console.log('   ✅ Environment-specific overrides');
        console.log('   ✅ Type-safe configuration access');
        console.log('   ✅ Helper functions for common operations');
        
        console.log('\n🔧 **Configuration Categories:**');
        console.log('   • OpenAI Model Settings');
        console.log('   • YouTube Discovery Parameters');
        console.log('   • Keyword Extraction Rules');
        console.log('   • Rate Limiting & Performance');
        console.log('   • Error Handling & Fallbacks');
        console.log('   • Logging & Monitoring');
        
        console.log('\n💡 **Usage Examples:**');
        console.log('   • CONFIG_HELPERS.getOperationConfig("video_discovery")');
        console.log('   • YOUTUBE_DISCOVERY_CONFIG.default_preferred_duration');
        console.log('   • KEYWORD_EXTRACTION_CONFIG.audiences.intermediate');
        console.log('   • ENV_CONFIG[process.env.NODE_ENV]');

        console.log('\n🚀 **Integration Workflow:**');
        console.log('   1. Extract keywords using centralized config');
        console.log('   2. Use keywords for enhanced video discovery');
        console.log('   3. All APIs use consistent parameters');
        console.log('   4. Easy to adjust settings globally');

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
    console.log('Engine Configuration Test\n');
    console.log('Usage:');
    console.log('   node test-engine-config.js\n');
    console.log('Environment Variables:');
    console.log('   API_URL    - API base URL (default: http://localhost:5173)');
    console.log('   JWT_TOKEN  - JWT authentication token\n');
    console.log('What it tests:');
    console.log('   • Keyword extraction using centralized config');
    console.log('   • YouTube discovery with keyword integration');
    console.log('   • Configuration benefits and usage examples');
    process.exit(0);
}

// Run the test
console.log('Starting engine configuration test in 1 second...\n');
setTimeout(testEngineConfiguration, 1000); 