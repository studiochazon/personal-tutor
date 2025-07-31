#!/usr/bin/env node

/**
 * Simple test for the Keyword Extraction API
 * Tests the PATCH /api/engine/v3/keyword_generation endpoint
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    apiUrl: process.env.API_URL || 'http://localhost:5173',
    jwtToken: process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzUzOTM3OTAxLCJleHAiOjE3NTQ1NDI3MDF9.1s46nONej8-vASxEhAT-hToYrQJQs7qsj03EQDUwx-M',
    testTimeout: 30000, // 30 seconds
};

// Test data
const testCourseText = `
**Course Title: Understanding Creationism: Historical, Theological, and Scientific Perspectives**

**Course Description:**
This comprehensive course explores the concept of creationism, examining its historical development, various interpretations, and the ongoing debates surrounding its place in education and society.

**Learning Objectives:**
1. Understand the historical context and development of creationist thought.
2. Identify and differentiate between various forms of creationism.
3. Analyze the theological underpinnings of creationist beliefs.

**Course Outline:**

**Lesson 1: Introduction to Creationism**
- Content: Define creationism and its significance in religious and cultural contexts.

**Lesson 2: Historical Development of Creationist Beliefs**
- Content: Trace the historical progression of creationist beliefs from ancient times to the present.

**Lesson 3: Forms of Creationism**
- Content: Examine different types including Young Earth Creationism, Old Earth Creationism, Gap Creationism.
`;

async function makeRequest(url, options) {
    // Handle fetch for different Node.js versions
    let fetch;
    
    if (global.fetch) {
        fetch = global.fetch;
    } else if (typeof require !== 'undefined') {
        try {
            fetch = require('node-fetch');
        } catch (e) {
            // For Node.js 18+, fetch should be available globally
            if (typeof globalThis.fetch !== 'undefined') {
                fetch = globalThis.fetch;
            } else {
                throw new Error('No fetch implementation available. Use Node.js 18+ or install node-fetch.');
            }
        }
    }

    return fetch(url, options);
}

async function testKeywordAPI() {
    console.log('🧪 Simple Keyword Extraction API Test\n');
    
    const startTime = Date.now();
    
    try {
        console.log('📋 Test Configuration:');
        console.log(`   API URL: ${config.apiUrl}`);
        console.log(`   JWT Token: ${config.jwtToken.substring(0, 20)}...`);
        console.log(`   Test Data Length: ${testCourseText.length} characters\n`);

        // Prepare request
        const requestBody = {
            course_plan_text: testCourseText,
            audience: 'intermediate',
            depth: 'comprehensive'
        };

        console.log('🚀 Making API request...');
        
        const response = await makeRequest(`${config.apiUrl}/api/engine/v3/keyword_generation`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.jwtToken}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseTime = Date.now() - startTime;
        
        console.log(`✅ Response received (${responseTime}ms)`);
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:');
            console.error(errorText);
            return;
        }

        const result = await response.json();

        if (!result.success) {
            console.error('❌ API returned failure:', result.error);
            return;
        }

        // Display results
        console.log('\n📊 Keyword Extraction Results:');
        console.log('='.repeat(40));
        
        const cloud = result.keyword_cloud;
        
        if (cloud.primary_keywords?.length > 0) {
            console.log(`\n🎯 Primary Keywords (${cloud.primary_keywords.length}):`);
            cloud.primary_keywords.slice(0, 5).forEach((k, i) => console.log(`   ${i+1}. ${k}`));
            if (cloud.primary_keywords.length > 5) console.log(`   ... and ${cloud.primary_keywords.length - 5} more`);
        }

        if (cloud.secondary_keywords?.length > 0) {
            console.log(`\n🔍 Secondary Keywords (${cloud.secondary_keywords.length}):`);
            cloud.secondary_keywords.slice(0, 5).forEach((k, i) => console.log(`   ${i+1}. ${k}`));
            if (cloud.secondary_keywords.length > 5) console.log(`   ... and ${cloud.secondary_keywords.length - 5} more`);
        }

        if (cloud.video_search_terms?.length > 0) {
            console.log(`\n🎥 Video Search Terms (${cloud.video_search_terms.length}):`);
            cloud.video_search_terms.slice(0, 5).forEach((k, i) => console.log(`   ${i+1}. ${k}`));
            if (cloud.video_search_terms.length > 5) console.log(`   ... and ${cloud.video_search_terms.length - 5} more`);
        }

        // Summary
        const totalKeywords = (cloud.primary_keywords?.length || 0) + 
                             (cloud.secondary_keywords?.length || 0) + 
                             (cloud.long_tail_keywords?.length || 0) + 
                             (cloud.video_search_terms?.length || 0);

        console.log('\n📈 Summary:');
        console.log(`   Total Keywords Generated: ${totalKeywords}`);
        console.log(`   API Response Time: ${responseTime}ms`);
        console.log(`   Test Status: ✅ PASSED`);
        
        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('\n❌ Test Failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Time: ${responseTime}ms`);
        
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Ensure server is running: npm run dev');
        console.log('   2. Check OpenAI API key is configured');
        console.log('   3. Verify JWT token is valid');
        console.log('   4. Check API endpoint is accessible');
        
        process.exit(1);
    }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Simple Keyword Extraction API Test\n');
    console.log('Usage:');
    console.log('   node test-keyword-simple.js\n');
    console.log('Environment Variables:');
    console.log('   API_URL    - API base URL (default: http://localhost:5173)');
    console.log('   JWT_TOKEN  - JWT authentication token\n');
    console.log('Example:');
    console.log('   API_URL=http://localhost:5173 JWT_TOKEN=your-token node test-keyword-simple.js');
    process.exit(0);
}

// Run the test
console.log('Starting test in 1 second...\n');
setTimeout(testKeywordAPI, 1000);