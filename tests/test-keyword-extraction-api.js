#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5173';
const TEST_JWT_TOKEN = process.env.TEST_JWT_TOKEN || process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdvb2dsZUlkIjoidGVzdC1nb29nbGUtaWQtMTIzIiwiaWF0IjoxNzUzOTM3OTAxLCJleHAiOjE3NTQ1NDI3MDF9.1s46nONej8-vASxEhAT-hToYrQJQs7qsj03EQDUwx-M';

async function testKeywordExtractionAPI() {
    console.log('🧪 Testing Keyword Extraction API');
    console.log('='.repeat(60));
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log(`🔑 Using JWT Token: ${TEST_JWT_TOKEN.substring(0, 20)}...`);
    console.log();

    try {
        // Read the creationism course plan
        const coursePlanPath = path.join(__dirname, '..', 'client', 'llm-logs', 'simple-response', '1-creationism.txt');
        
        if (!fs.existsSync(coursePlanPath)) {
            throw new Error(`Course plan file not found: ${coursePlanPath}`);
        }

        const coursePlanText = fs.readFileSync(coursePlanPath, 'utf8');
        
        console.log('📄 Test Data:');
        console.log(`   File: ${path.basename(coursePlanPath)}`);
        console.log(`   Size: ${coursePlanText.length} characters`);
        console.log(`   Preview: ${coursePlanText.substring(0, 100)}...`);
        console.log();

        // Prepare the request
        const requestBody = {
            course_plan_text: coursePlanText,
            audience: 'intermediate',
            depth: 'comprehensive'
        };

        console.log('🚀 Making API Request...');
        console.log(`   Method: PATCH`);
        console.log(`   Endpoint: ${API_BASE_URL}/api/engine/v3/keyword_generation`);
        console.log(`   Payload size: ${JSON.stringify(requestBody).length} bytes`);
        console.log();

        const startTime = Date.now();

        // Make the actual API call
        const response = await fetch(`${API_BASE_URL}/api/engine/v3/keyword_generation`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT_TOKEN}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseTime = Date.now() - startTime;

        console.log('📡 Response Details:');
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Response Time: ${responseTime}ms`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        console.log();

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:');
            console.error(errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Validate response structure
        if (!result.success) {
            console.error('❌ API returned failure:');
            console.error(result.error || 'Unknown error');
            return;
        }

        if (!result.keyword_cloud) {
            console.error('❌ Missing keyword_cloud in response');
            return;
        }

        console.log('✅ API Response Analysis:');
        console.log('='.repeat(60));
        console.log();

        const cloud = result.keyword_cloud;

        // Display results categorized
        console.log('🎯 PRIMARY KEYWORDS:');
        if (cloud.primary_keywords && cloud.primary_keywords.length > 0) {
            cloud.primary_keywords.forEach((keyword, i) => {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${keyword}`);
            });
        } else {
            console.log('   (none found)');
        }
        console.log();

        console.log('🔍 SECONDARY KEYWORDS:');
        if (cloud.secondary_keywords && cloud.secondary_keywords.length > 0) {
            cloud.secondary_keywords.forEach((keyword, i) => {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${keyword}`);
            });
        } else {
            console.log('   (none found)');
        }
        console.log();

        console.log('📝 LONG-TAIL KEYWORDS:');
        if (cloud.long_tail_keywords && cloud.long_tail_keywords.length > 0) {
            cloud.long_tail_keywords.forEach((keyword, i) => {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${keyword}`);
            });
        } else {
            console.log('   (none found)');
        }
        console.log();

        console.log('🎥 VIDEO SEARCH TERMS:');
        if (cloud.video_search_terms && cloud.video_search_terms.length > 0) {
            cloud.video_search_terms.slice(0, 10).forEach((keyword, i) => {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${keyword}`);
            });
            if (cloud.video_search_terms.length > 10) {
                console.log(`   ... and ${cloud.video_search_terms.length - 10} more`);
            }
        } else {
            console.log('   (none found)');
        }
        console.log();

        console.log('❌ EXCLUDED TERMS:');
        if (cloud.excluded_terms && cloud.excluded_terms.length > 0) {
            cloud.excluded_terms.forEach((keyword, i) => {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${keyword}`);
            });
        } else {
            console.log('   (none found)');
        }
        console.log();

        // Summary statistics
        const stats = {
            primary: cloud.primary_keywords?.length || 0,
            secondary: cloud.secondary_keywords?.length || 0,
            longTail: cloud.long_tail_keywords?.length || 0,
            videoTerms: cloud.video_search_terms?.length || 0,
            excluded: cloud.excluded_terms?.length || 0
        };

        const totalKeywords = stats.primary + stats.secondary + stats.longTail + stats.videoTerms;

        console.log('📊 SUMMARY STATISTICS:');
        console.log(`   Primary Keywords:    ${stats.primary}`);
        console.log(`   Secondary Keywords:  ${stats.secondary}`);
        console.log(`   Long-tail Keywords:  ${stats.longTail}`);
        console.log(`   Video Search Terms:  ${stats.videoTerms}`);
        console.log(`   Excluded Terms:      ${stats.excluded}`);
        console.log(`   ────────────────────────────────`);
        console.log(`   Total Keywords:      ${totalKeywords}`);
        console.log(`   API Reported Total:  ${result.total_keywords || 'N/A'}`);
        console.log(`   Response Time:       ${responseTime}ms`);
        console.log(`   Log ID:              ${result.log_id || 'N/A'}`);
        console.log();

        // Quality assessment
        console.log('🔬 QUALITY ASSESSMENT:');
        const quality = assessKeywordQuality(cloud, coursePlanText);
        console.log(`   Relevance Score:     ${quality.relevanceScore}/10`);
        console.log(`   Coverage Score:      ${quality.coverageScore}/10`);
        console.log(`   Diversity Score:     ${quality.diversityScore}/10`);
        console.log(`   Overall Quality:     ${quality.overallScore}/10`);
        console.log();

        if (quality.suggestions.length > 0) {
            console.log('💡 IMPROVEMENT SUGGESTIONS:');
            quality.suggestions.forEach((suggestion, i) => {
                console.log(`   ${i + 1}. ${suggestion}`);
            });
            console.log();
        }

        console.log('✅ Test completed successfully!');
        console.log();

        // Output sample search commands
        console.log('🔍 SAMPLE SEARCH USAGE:');
        console.log('You can now use these keywords to search for content:');
        console.log();
        console.log('YouTube API search example:');
        if (cloud.video_search_terms && cloud.video_search_terms.length > 0) {
            const sampleTerms = cloud.video_search_terms.slice(0, 3);
            sampleTerms.forEach(term => {
                console.log(`   youtube.search('${term}')`);
            });
        }
        console.log();

    } catch (error) {
        console.error('❌ Test Failed:');
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
        console.log();
        
        // Provide helpful troubleshooting
        console.log('🛠️  TROUBLESHOOTING:');
        console.log('   1. Make sure the server is running: npm run dev');
        console.log('   2. Check if OpenAI API key is configured in .env');
        console.log('   3. Verify JWT token is valid');
        console.log('   4. Check API endpoint URL is correct');
        console.log();
        
        process.exit(1);
    }
}

function assessKeywordQuality(keywordCloud, originalText) {
    const suggestions = [];
    
    // Count total keywords
    const totalKeywords = (keywordCloud.primary_keywords?.length || 0) +
                         (keywordCloud.secondary_keywords?.length || 0) +
                         (keywordCloud.long_tail_keywords?.length || 0) +
                         (keywordCloud.video_search_terms?.length || 0);

    // Relevance score based on keyword presence in original text
    let relevantCount = 0;
    const allKeywords = [
        ...(keywordCloud.primary_keywords || []),
        ...(keywordCloud.secondary_keywords || []),
        ...(keywordCloud.long_tail_keywords || [])
    ];

    const lowerText = originalText.toLowerCase();
    allKeywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            relevantCount++;
        }
    });

    const relevanceScore = totalKeywords > 0 ? Math.round((relevantCount / allKeywords.length) * 10) : 0;

    // Coverage score based on keyword count
    const expectedTotal = 50; // Based on API documentation
    const coverageScore = Math.min(Math.round((totalKeywords / expectedTotal) * 10), 10);

    // Diversity score based on category distribution
    const categories = [
        keywordCloud.primary_keywords?.length || 0,
        keywordCloud.secondary_keywords?.length || 0,
        keywordCloud.long_tail_keywords?.length || 0,
        keywordCloud.video_search_terms?.length || 0
    ];
    const diversityScore = categories.filter(count => count > 0).length * 2.5;

    const overallScore = Math.round((relevanceScore + coverageScore + diversityScore) / 3);

    // Generate suggestions
    if (relevanceScore < 7) {
        suggestions.push('Keywords could be more relevant to the source content');
    }
    if (coverageScore < 7) {
        suggestions.push('Could generate more keywords for better coverage');
    }
    if (diversityScore < 7) {
        suggestions.push('Could improve distribution across keyword categories');
    }
    if (totalKeywords < 30) {
        suggestions.push('Consider generating more keywords for comprehensive coverage');
    }

    return {
        relevanceScore,
        coverageScore,
        diversityScore: Math.round(diversityScore),
        overallScore,
        suggestions
    };
}

// Check for fetch availability (Node.js 18+ has built-in fetch)
if (typeof fetch === 'undefined') {
    try {
        // Try to use node-fetch if available
        global.fetch = require('node-fetch');
    } catch (error) {
        console.error('❌ No fetch implementation found');
        console.error('   This test requires Node.js 18+ or install: npm install node-fetch');
        console.error(`   Current Node.js version: ${process.version}`);
        process.exit(1);
    }
}

// Show usage information if needed
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('🧪 Keyword Extraction API Test');
    console.log();
    console.log('Usage:');
    console.log('   node test-keyword-extraction-api.js');
    console.log();
    console.log('Environment Variables:');
    console.log('   API_BASE_URL     - Base URL for the API (default: http://localhost:5173)');
    console.log('   TEST_JWT_TOKEN   - JWT token for authentication');
    console.log();
    console.log('Prerequisites:');
    console.log('   1. Server must be running (npm run dev)');
    console.log('   2. OpenAI API key must be configured');
    console.log('   3. Valid JWT token must be provided');
    console.log();
    process.exit(0);
}

// Run the test
testKeywordExtractionAPI();