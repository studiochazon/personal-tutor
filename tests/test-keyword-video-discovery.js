#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const JWT_TOKEN = process.env.JWT_TOKEN;

if (!JWT_TOKEN) {
    console.error('❌ JWT_TOKEN environment variable is required');
    console.log('💡 Run: node ../client/generate-test-token.mjs to generate a token');
    process.exit(1);
}

async function testKeywordVideoDiscovery() {
    console.log('🚀 Testing Keyword Video Discovery API');
    console.log('=====================================\n');

    const testData = {
        keyword_cloud: {
            primary_keywords: [
                "creationism",
                "evolution",
                "intelligent design",
                "young earth creationism",
                "old earth creationism"
            ],
            secondary_keywords: [
                "biblical creation",
                "scientific method",
                "fossil record",
                "radiometric dating",
                "natural selection",
                "genetic evidence",
                "theological perspectives",
                "educational debates"
            ],
            long_tail_keywords: [
                "introduction to creationism",
                "history of creationist beliefs",
                "types of creationism explained",
                "theological perspectives on creationism",
                "scientific critiques of creationism",
                "understanding creationism in education",
                "historical context of creationist thought",
                "differentiating forms of creationism"
            ],
            video_search_terms: [
                "creationism tutorial",
                "understanding creationism explained",
                "creationism course guide",
                "learn about creationism basics",
                "historical development of creationism video",
                "types of creationism tutorial",
                "theological perspectives on creationism explained",
                "scientific critiques of creationism guide"
            ],
            excluded_terms: [
                "religion",
                "science",
                "education",
                "beliefs",
                "philosophy"
            ]
        },
        courseTitle: "Understanding Creationism: Historical, Theological, and Scientific Perspectives",
        preferred_duration: 10,
        quality_preference: "educational",
        target_video_count: 20 // Start with a smaller number for testing
    };

    try {
        console.log('📤 Sending request to keyword video discovery API...');
        
        const response = await fetch(`${BASE_URL}/api/engine/v3/keyword_video_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ API Error:', response.status, data.error);
            return false;
        }

        console.log('✅ API Response Received\n');

        // Display basic results
        console.log('📊 Results Summary:');
        console.log(`   Total Videos Requested: ${testData.target_video_count}`);
        console.log(`   Total Videos Returned: ${data.total_videos || 0}`);
        console.log(`   Successful Matches: ${data.successful_matches || 0}`);
        console.log(`   Success Rate: ${data.total_videos ? ((data.successful_matches / data.total_videos) * 100).toFixed(1) : 0}%\n`);

        // Display cost information
        if (data.cost_info) {
            console.log('💰 Cost Information:');
            console.log(`   Total Cost: $${data.cost_info.total_cost.toFixed(6)}`);
            console.log(`   Prompt Cost: $${data.cost_info.prompt_cost.toFixed(6)}`);
            console.log(`   Completion Cost: $${data.cost_info.completion_cost.toFixed(6)}`);
            console.log(`   Model: ${data.cost_info.model}`);
            console.log(`   Currency: ${data.cost_info.currency}\n`);
        }

        // Display API usage
        if (data.api_usage) {
            console.log('📈 API Usage:');
            console.log(`   Total Requests: ${data.api_usage.total_requests}`);
            console.log(`   Total Tokens: ${data.api_usage.total_tokens}`);
            console.log(`   Models Used: ${data.api_usage.models_used.join(', ')}\n`);
        }

        // Display sample videos
        if (data.videos && data.videos.length > 0) {
            console.log('🎥 Sample Videos (first 5):');
            data.videos.slice(0, 5).forEach((video, index) => {
                console.log(`   ${index + 1}. ${video.video_title || 'No title'}`);
                console.log(`      URL: ${video.video_url || 'No URL'}`);
                console.log(`      Duration: ${video.video_duration ? Math.round(video.video_duration / 60) + ' min' : 'Unknown'}`);
                console.log(`      Confidence: ${(video.confidence_score * 100).toFixed(1)}%`);
                console.log(`      Was Replaced: ${video.was_replaced ? 'Yes' : 'No'}`);
                if (video.keyword_match && video.keyword_match.length > 0) {
                    console.log(`      Keywords: ${video.keyword_match.slice(0, 3).join(', ')}${video.keyword_match.length > 3 ? '...' : ''}`);
                }
                console.log('');
            });

            if (data.videos.length > 5) {
                console.log(`   ... and ${data.videos.length - 5} more videos\n`);
            }
        }

        // Display video quality analysis
        if (data.videos && data.videos.length > 0) {
            const validVideos = data.videos.filter(v => v.video_url);
            const replacedVideos = data.videos.filter(v => v.was_replaced);
            const avgConfidence = data.videos.reduce((sum, v) => sum + v.confidence_score, 0) / data.videos.length;

            console.log('📊 Video Quality Analysis:');
            console.log(`   Valid Videos: ${validVideos.length}/${data.videos.length}`);
            console.log(`   Replaced Videos: ${replacedVideos.length}`);
            console.log(`   Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
            console.log(`   Videos with Keywords: ${data.videos.filter(v => v.keyword_match && v.keyword_match.length > 0).length}\n`);
        }

        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

async function testWithDifferentParameters() {
    console.log('🔄 Testing with different parameters...\n');

    const testCases = [
        {
            name: "Small Video Count (10)",
            data: {
                keyword_cloud: {
                    primary_keywords: ["machine learning", "artificial intelligence"],
                    secondary_keywords: ["neural networks", "deep learning", "algorithms"],
                    long_tail_keywords: ["introduction to machine learning", "basics of AI"],
                    video_search_terms: ["machine learning tutorial", "AI explained"],
                    excluded_terms: ["gaming", "entertainment"]
                },
                courseTitle: "Introduction to Machine Learning",
                preferred_duration: 15,
                quality_preference: "educational",
                target_video_count: 10
            }
        },
        {
            name: "Different Quality Preference",
            data: {
                keyword_cloud: {
                    primary_keywords: ["web development", "programming"],
                    secondary_keywords: ["HTML", "CSS", "JavaScript", "React"],
                    long_tail_keywords: ["learn web development", "coding for beginners"],
                    video_search_terms: ["web development tutorial", "programming guide"],
                    excluded_terms: ["gaming", "hardware"]
                },
                courseTitle: "Web Development Fundamentals",
                preferred_duration: 20,
                quality_preference: "engaging",
                target_video_count: 15
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`🧪 Testing: ${testCase.name}`);
        
        try {
            const response = await fetch(`${BASE_URL}/api/engine/v3/keyword_video_discovery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JWT_TOKEN}`
                },
                body: JSON.stringify(testCase.data)
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`   ✅ Success: ${data.total_videos} videos, ${data.successful_matches} matches`);
                if (data.cost_info) {
                    console.log(`   💰 Cost: $${data.cost_info.total_cost.toFixed(6)}`);
                }
            } else {
                console.log(`   ❌ Failed: ${data.error}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log('');
    }
}

async function runAllTests() {
    console.log('🧪 Keyword Video Discovery API Test Suite');
    console.log('==========================================\n');

    // Test 1: Basic functionality
    const basicTest = await testKeywordVideoDiscovery();
    
    if (basicTest) {
        // Test 2: Different parameters
        await testWithDifferentParameters();
        
        console.log('✅ All tests completed successfully!');
    } else {
        console.log('❌ Basic test failed, skipping additional tests');
    }
}

// Run the tests
runAllTests().catch(console.error);
