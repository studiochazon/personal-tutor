#!/usr/bin/env node

/**
 * Test script for YouTube Discovery API using Gemini 2.5 Pro
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
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzIyNDAwOTI2LCJleHAiOjE3MjMwMDU3MjZ9.Ql8Hw3EWWqKPLlrOFsrlJXYnBHqWN7r-d5_3S9FBv_w';

const testCases = [
    {
        name: 'Basic Gemini YouTube Discovery',
        request: {
            lessons: [
                {
                    title: "Introduction to Machine Learning",
                    topic: "Overview of ML concepts and applications",
                    duration: 15,
                    audience: "beginners"
                },
                {
                    title: "Neural Networks Basics", 
                    topic: "Understanding artificial neural networks",
                    duration: 20,
                    audience: "intermediate"
                }
            ],
            courseTitle: "Machine Learning Fundamentals",
            preferred_duration: 12,
            quality_preference: "educational",
            max_retries: 2
        }
    },
    {
        name: 'Gemini with Keywords Integration',
        request: {
            lessons: [
                {
                    title: "Python for Data Science",
                    topic: "Python programming for data analysis",
                    duration: 25,
                    audience: "beginners"
                }
            ],
            courseTitle: "Data Science with Python",
            preferred_duration: 15,
            quality_preference: "educational",
            use_keyword_extraction: true,
            keyword_cloud: {
                primary_keywords: ["python", "data science", "pandas", "numpy"],
                secondary_keywords: ["matplotlib", "jupyter", "analysis", "visualization"],
                long_tail_keywords: ["python data analysis tutorial", "pandas dataframe manipulation"],
                video_search_terms: ["python programming tutorial", "data science with python"],
                excluded_terms: ["advanced", "expert", "commercial"]
            }
        }
    }
];

async function testYouTubeDiscovery(testCase) {
    console.log(`\n🧪 Running Test: ${testCase.name}`);
    console.log('=' .repeat(50));
    
    try {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT}`
            },
            body: JSON.stringify(testCase.request)
        });
        
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log(`✅ Test passed in ${duration}ms`);
        console.log(`📊 Provider: ${result.provider || 'Unknown'}`);
        console.log(`📺 Videos found: ${result.videos?.length || 0}`);
        
        if (result.videos?.length > 0) {
            console.log('\n📹 Sample Video Results:');
            result.videos.slice(0, 2).forEach((video, index) => {
                console.log(`  ${index + 1}. ${video.video_title}`);
                console.log(`     URL: ${video.video_url}`);
                console.log(`     Duration: ${video.video_duration}s`);
                console.log(`     Confidence: ${video.confidence_score}`);
                console.log(`     Platform: ${video.platform}`);
                console.log('');
            });
        }
        
        if (result.cost_info) {
            console.log(`💰 Cost: $${result.cost_info.total_cost.toFixed(6)} (${result.cost_info.provider})`);
            console.log(`🔢 Tokens: ${result.cost_info.tokens_used.total_tokens}`);
        }
        
        if (result.api_usage) {
            console.log(`⏱️  API Duration: ${result.api_usage.duration_ms}ms`);
            console.log(`🤖 Model: ${result.api_usage.model}`);
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Gemini YouTube Discovery Tests');
    console.log(`📡 Testing against: ${API_BASE_URL}`);
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
        const success = await testYouTubeDiscovery(testCase);
        if (success) passed++;
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Gemini integration is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
        process.exit(1);
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});