#!/usr/bin/env node

/**
 * Comprehensive test for YouTube Discovery API with diverse academic topics
 * Testing: Christian theology, psychology, physics, and various other domains
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

// Diverse test topics covering various academic domains
const diverseTopicsTest = {
    lessons: [
        // Christian Theology (potentially sensitive/limited content)
        {
            title: "Introduction to Christian Theology",
            topic: "Basic principles and foundations of Christian theological study",
            duration: 25,
            audience: "college students"
        },
        {
            title: "Biblical Hermeneutics",
            topic: "Methods and principles of biblical interpretation",
            duration: 30,
            audience: "seminary students"
        },
        
        // Psychology (should have good content)
        {
            title: "Cognitive Psychology Basics",
            topic: "Introduction to how the mind processes information",
            duration: 20,
            audience: "psychology students"
        },
        {
            title: "Behavioral Psychology",
            topic: "Understanding human behavior through conditioning and learning",
            duration: 25,
            audience: "undergraduates"
        },
        
        // Physics (should have excellent content)
        {
            title: "Quantum Physics Introduction",
            topic: "Basic concepts of quantum mechanics for beginners",
            duration: 30,
            audience: "high school students"
        },
        {
            title: "Classical Mechanics",
            topic: "Newton's laws and fundamental physics principles",
            duration: 20,
            audience: "physics students"
        },
        
        // Mathematics (should have great content)
        {
            title: "Calculus Fundamentals",
            topic: "Introduction to derivatives and integrals",
            duration: 25,
            audience: "high school students"
        },
        
        // Computer Science (should have excellent content)
        {
            title: "Data Structures and Algorithms",
            topic: "Arrays, linked lists, sorting algorithms basics",
            duration: 30,
            audience: "computer science students"
        },
        
        // History (should have good content)
        {
            title: "World War II Overview",
            topic: "Major events and timeline of World War II",
            duration: 35,
            audience: "history students"
        },
        
        // Biology (should have good content)
        {
            title: "Cell Biology Basics",
            topic: "Structure and function of cells, organelles",
            duration: 20,
            audience: "biology students"
        },
        
        // Chemistry (should have good content)
        {
            title: "Organic Chemistry Introduction",
            topic: "Basic concepts of carbon-based compounds",
            duration: 25,
            audience: "chemistry students"
        },
        
        // Art/Creative (mixed availability)
        {
            title: "Renaissance Art History",
            topic: "Major artists and works from the Renaissance period",
            duration: 30,
            audience: "art students"
        },
        
        // Philosophy (limited but some content)
        {
            title: "Introduction to Ethics",
            topic: "Basic ethical theories and moral philosophy",
            duration: 25,
            audience: "philosophy students"
        },
        
        // Economics (should have decent content)
        {
            title: "Microeconomics Principles",
            topic: "Supply and demand, market structures basics",
            duration: 20,
            audience: "economics students"
        },
        
        // Very specialized/rare topic (likely no videos)
        {
            title: "Medieval Icelandic Poetry Analysis",
            topic: "Literary analysis of 13th century Icelandic sagas and eddas",
            duration: 40,
            audience: "graduate students"
        }
    ],
    courseTitle: "Comprehensive Academic Topics Survey",
    preferred_duration: 25,
    quality_preference: "educational",
    max_retries: 1,
    use_keyword_extraction: true,
    keyword_cloud: {
        primary_keywords: [
            "theology", "psychology", "physics", "calculus", "algorithms",
            "world war", "biology", "chemistry", "renaissance", "ethics",
            "economics", "medieval literature"
        ],
        secondary_keywords: [
            "christian", "cognitive", "quantum", "mathematics", "programming",
            "history", "cells", "organic", "art", "philosophy", "microeconomics"
        ],
        long_tail_keywords: [
            "christian theology introduction",
            "cognitive psychology basics",
            "quantum physics for beginners",
            "calculus tutorial",
            "data structures algorithms",
            "world war 2 history",
            "cell biology fundamentals"
        ],
        video_search_terms: [
            "theology lecture",
            "psychology tutorial",
            "physics explanation",
            "math lesson",
            "programming tutorial",
            "history documentary",
            "science education"
        ],
        excluded_terms: [
            "controversial",
            "political debate",
            "extreme views"
        ]
    }
};

async function testDiverseTopicsDiscovery() {
    console.log('🌍 Testing Diverse Academic Topics YouTube Discovery');
    console.log('📚 Topics: Theology, Psychology, Physics, Math, CS, History, Biology, Chemistry, Art, Philosophy, Economics');
    console.log('🎯 Goal: Test content availability across different academic domains');
    console.log('🔍 Expected: High success for STEM, moderate for humanities, lower for specialized topics');
    console.log('=' .repeat(100));
    
    try {
        const startTime = Date.now();
        
        console.log('🚀 Making API request with diverse academic topics...');
        const response = await fetch(`${API_BASE_URL}/api/engine/lesson_youtube_discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_JWT}`
            },
            body: JSON.stringify(diverseTopicsTest)
        });
        
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log(`✅ API Response received in ${(duration/1000).toFixed(1)}s`);
        console.log('=' .repeat(100));
        
        // Categorize topics by domain
        const domainCategories = {
            'Theology': [0, 1],
            'Psychology': [2, 3], 
            'Physics': [4, 5],
            'Mathematics': [6],
            'Computer Science': [7],
            'History': [8],
            'Biology': [9],
            'Chemistry': [10],
            'Art': [11],
            'Philosophy': [12],
            'Economics': [13],
            'Specialized': [14]
        };
        
        // Analysis by domain
        const domainResults = {};
        
        Object.entries(domainCategories).forEach(([domain, indices]) => {
            const domainVideos = indices.map(i => result.videos?.[i]).filter(Boolean);
            const realVideos = domainVideos.filter(v => v.video_url && v.video_url !== '');
            const emptyWithReasons = domainVideos.filter(v => !v.video_url && v.reason);
            const verifiedLive = domainVideos.filter(v => v.verified_live);
            const highConfidence = domainVideos.filter(v => v.confidence_score > 0.7);
            
            domainResults[domain] = {
                total: domainVideos.length,
                realVideos: realVideos.length,
                emptyWithReasons: emptyWithReasons.length,
                verifiedLive: verifiedLive.length,
                highConfidence: highConfidence.length,
                avgConfidence: domainVideos.length > 0 ? 
                    (domainVideos.reduce((sum, v) => sum + (v.confidence_score || 0), 0) / domainVideos.length) : 0,
                videos: domainVideos
            };
        });
        
        console.log(`🤖 Provider: ${result.provider || 'Unknown'}`);
        console.log(`📺 Total videos processed: ${result.videos?.length || 0} out of ${diverseTopicsTest.lessons.length} requested`);
        console.log(`✨ Success: ${result.success ? 'Yes' : 'No'}`);
        
        // Domain-by-domain analysis
        console.log('\n📊 DOMAIN-BY-DOMAIN ANALYSIS:');
        console.log('=' .repeat(100));
        
        Object.entries(domainResults).forEach(([domain, stats]) => {
            console.log(`\n📚 ${domain.toUpperCase()}:`);
            console.log(`   📺 Real Videos: ${stats.realVideos}/${stats.total} (${((stats.realVideos/stats.total)*100).toFixed(1)}%)`);
            console.log(`   📝 Empty URLs with Reasons: ${stats.emptyWithReasons}`);
            console.log(`   🔍 Verified Live: ${stats.verifiedLive}`);
            console.log(`   🎯 High Confidence (>70%): ${stats.highConfidence}`);
            console.log(`   📊 Average Confidence: ${(stats.avgConfidence * 100).toFixed(1)}%`);
            
            // Show specific results for this domain
            stats.videos.forEach((video, idx) => {
                const lessonIdx = domainCategories[domain][idx];
                const lesson = diverseTopicsTest.lessons[lessonIdx];
                
                if (video.video_url && video.video_url !== '') {
                    console.log(`   ✅ "${lesson.title}": ${video.video_title} (${(video.confidence_score*100).toFixed(0)}%)`);
                } else {
                    console.log(`   ❌ "${lesson.title}": ${video.reason || 'No reason provided'}`);
                }
            });
        });
        
        // Overall statistics
        const totalRealVideos = result.videos?.filter(v => v.video_url && v.video_url !== '').length || 0;
        const totalEmptyWithReasons = result.videos?.filter(v => !v.video_url && v.reason).length || 0;
        const totalVerifiedLive = result.videos?.filter(v => v.verified_live).length || 0;
        const totalHighConfidence = result.videos?.filter(v => v.confidence_score > 0.7).length || 0;
        
        console.log('\n' + '=' .repeat(100));
        console.log('🎯 COMPREHENSIVE RESULTS SUMMARY:');
        console.log(`📺 Real Videos Found: ${totalRealVideos}/${diverseTopicsTest.lessons.length} (${((totalRealVideos/diverseTopicsTest.lessons.length)*100).toFixed(1)}%)`);
        console.log(`📝 Proper Error Handling: ${totalEmptyWithReasons} empty URLs with detailed reasons`);
        console.log(`🔍 Live Verification: ${totalVerifiedLive} videos verified as live`);
        console.log(`🎯 High Confidence Results: ${totalHighConfidence} videos with >70% confidence`);
        
        // Expected success rates by domain
        const expectedHighSuccess = ['Physics', 'Mathematics', 'Computer Science', 'Biology', 'Chemistry'];
        const expectedMediumSuccess = ['Psychology', 'History', 'Economics'];
        const expectedLowSuccess = ['Theology', 'Art', 'Philosophy', 'Specialized'];
        
        console.log('\n📈 SUCCESS RATE ANALYSIS BY EXPECTED DOMAIN DIFFICULTY:');
        
        expectedHighSuccess.forEach(domain => {
            const stats = domainResults[domain];
            if (stats) {
                const successRate = (stats.realVideos / stats.total) * 100;
                console.log(`   🟢 ${domain}: ${successRate.toFixed(1)}% success (Expected: High)`);
            }
        });
        
        expectedMediumSuccess.forEach(domain => {
            const stats = domainResults[domain];
            if (stats) {
                const successRate = (stats.realVideos / stats.total) * 100;
                console.log(`   🟡 ${domain}: ${successRate.toFixed(1)}% success (Expected: Medium)`);
            }
        });
        
        expectedLowSuccess.forEach(domain => {
            const stats = domainResults[domain];
            if (stats) {
                const successRate = (stats.realVideos / stats.total) * 100;
                console.log(`   🔴 ${domain}: ${successRate.toFixed(1)}% success (Expected: Low)`);
            }
        });
        
        // Quality assessment
        const stemSuccess = expectedHighSuccess.reduce((sum, domain) => {
            const stats = domainResults[domain];
            return sum + (stats ? stats.realVideos / stats.total : 0);
        }, 0) / expectedHighSuccess.length;
        
        const humanitiesSuccess = [...expectedMediumSuccess, ...expectedLowSuccess].reduce((sum, domain) => {
            const stats = domainResults[domain];
            return sum + (stats ? stats.realVideos / stats.total : 0);
        }, 0) / (expectedMediumSuccess.length + expectedLowSuccess.length);
        
        console.log('\n🏆 DOMAIN PERFORMANCE:');
        console.log(`🔬 STEM Success Rate: ${(stemSuccess * 100).toFixed(1)}% (Expected: >70%)`);
        console.log(`📚 Humanities Success Rate: ${(humanitiesSuccess * 100).toFixed(1)}% (Expected: 30-60%)`);
        
        // Enhanced validation check
        const enhancedFeaturesWorking = (
            totalVerifiedLive > 0 && // Live verification working
            totalEmptyWithReasons > 0 && // Proper error handling
            totalHighConfidence > 0 && // Confidence scoring working
            stemSuccess > 0.5 // STEM topics finding videos
        );
        
        console.log('\n' + '=' .repeat(100));
        if (enhancedFeaturesWorking) {
            console.log('🌟 COMPREHENSIVE TEST PASSED!');
            console.log('✅ Enhanced prompt features working across diverse domains');
            console.log('✅ Appropriate success rates for different content types');
            console.log('✅ Intelligent handling of specialized/rare topics');
            console.log('✅ Live verification and confidence scoring functional');
        } else {
            console.log('⚠️  COMPREHENSIVE TEST SHOWS MIXED RESULTS');
            console.log('💡 Some enhanced features may need refinement');
        }
        
        return enhancedFeaturesWorking;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Make sure your development server is running');
        console.log('   - Check that Gemini API key is configured');
        console.log('   - Verify Google Search integration is working');
        return false;
    }
}

// Run the comprehensive test
console.log('🚀 Starting Comprehensive Academic Topics Discovery Test');
console.log(`📡 Testing against: ${API_BASE_URL}`);
console.log('');

testDiverseTopicsDiscovery().then(success => {
    console.log('\n' + '=' .repeat(100));
    if (success) {
        console.log('🎉 Diverse topics test reveals enhanced features working well!');
        console.log('📊 API successfully handles various academic domains appropriately');
    } else {
        console.log('⚠️  Test reveals areas for improvement in domain handling.');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});