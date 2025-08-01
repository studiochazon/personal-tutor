#!/usr/bin/env node

/**
 * Comprehensive test to verify if YouTube videos actually load
 * Tests both the API response and actual video availability
 */

// Use Node.js built-in fetch if available, otherwise use node-fetch
let fetch;
try {
    fetch = globalThis.fetch;
} catch (e) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
}

// Videos from response-14 (latest Gemini + Google Search result)
const videosFromResponse14 = [
    {
        lesson: "Introduction to Creationism",
        url: "https://www.youtube.com/embed/y_gM42sQ9sA",
        title: "What is Creationism? (Religious Studies) | Episode 1502",
        confidence: 0.9
    },
    {
        lesson: "Historical Development of Creationist Beliefs", 
        url: "https://www.youtube.com/embed/G5A3-f013p4",
        title: "A Brief History of Creationism",
        confidence: 0.8
    },
    {
        lesson: "Forms of Creationism",
        url: "https://www.youtube.com/embed/9Badd052g-k", 
        title: "Old-Earth vs. Young-Earth Creationism: A Primer",
        confidence: 1.0
    },
    {
        lesson: "Theological Foundations of Creationist Beliefs",
        url: "https://www.youtube.com/embed/rEMf0n813S4",
        title: "7 Major Interpretations of Genesis 1", 
        confidence: 0.9
    },
    {
        lesson: "Scientific Critiques of Creationism",
        url: "https://www.youtube.com/embed/P3GagfbA2vo",
        title: "Evidence for Evolution",
        confidence: 0.9
    }
];

async function checkVideoLoading(video, index) {
    const videoId = video.url.split('/embed/')[1];
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    
    console.log(`\n${index + 1}. ${video.title}`);
    console.log(`   🔗 Video ID: ${videoId}`);
    console.log(`   📊 Confidence: ${(video.confidence * 100)}%`);
    
    const result = {
        ...video,
        videoId,
        watchUrl,
        available: false,
        loadable: false,
        method: 'unknown',
        error: null
    };
    
    try {
        // Method 1: Test oEmbed API (most reliable for actual availability)
        console.log(`   🔍 Testing oEmbed API...`);
        try {
            const oembedResponse = await fetch(oembedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; video-availability-checker)'
                },
                timeout: 10000
            });
            
            if (oembedResponse.ok) {
                const oembedData = await oembedResponse.json();
                console.log(`   ✅ AVAILABLE via oEmbed`);
                console.log(`   📺 Actual Title: "${oembedData.title}"`);
                console.log(`   👤 Channel: ${oembedData.author_name}`);
                console.log(`   📏 Dimensions: ${oembedData.width}x${oembedData.height}`);
                
                result.available = true;
                result.loadable = true;
                result.method = 'oembed';
                result.actualTitle = oembedData.title;
                result.channel = oembedData.author_name;
                
                return result;
            } else {
                console.log(`   ❌ oEmbed failed: ${oembedResponse.status}`);
            }
        } catch (oembedError) {
            console.log(`   ❌ oEmbed error: ${oembedError.message}`);
        }
        
        // Method 2: Test YouTube watch page
        console.log(`   🔍 Testing YouTube watch page...`);
        const watchResponse = await fetch(watchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
        });
        
        if (watchResponse.ok) {
            const htmlContent = await watchResponse.text();
            
            // Check for video unavailability indicators
            const unavailableIndicators = [
                'Video unavailable',
                'This video is unavailable',
                'Private video',
                'This video is private',
                'Video removed',
                'This video has been removed',
                'Age-restricted',
                'Sign in to confirm your age',
                'This video is not available',
                'Content not available',
                'Playback on other websites has been disabled'
            ];
            
            const foundIndicator = unavailableIndicators.find(indicator => 
                htmlContent.toLowerCase().includes(indicator.toLowerCase())
            );
            
            if (foundIndicator) {
                console.log(`   ❌ UNAVAILABLE: ${foundIndicator}`);
                result.available = false;
                result.error = foundIndicator;
            } else {
                // Check for positive indicators
                const playableIndicators = [
                    '"isLiveContent":false',
                    '"videoDetails"',
                    'ytInitialPlayerResponse',
                    '"playabilityStatus":{"status":"OK"'
                ];
                
                const hasPlayableIndicator = playableIndicators.some(indicator => 
                    htmlContent.includes(indicator)
                );
                
                if (hasPlayableIndicator) {
                    console.log(`   ✅ LIKELY AVAILABLE (found playable indicators)`);
                    result.available = true;
                    result.loadable = true;
                    result.method = 'watch_page';
                } else {
                    console.log(`   ⚠️  UNCERTAIN (no clear indicators found)`);
                    result.available = true; // Assume available if no negative indicators
                    result.loadable = false;
                    result.method = 'watch_page_uncertain';
                }
            }
        } else {
            console.log(`   ❌ Watch page failed: ${watchResponse.status}`);
            result.error = `HTTP ${watchResponse.status}`;
        }
        
        // Method 3: Test embed page directly
        if (!result.loadable) {
            console.log(`   🔍 Testing embed page directly...`);
            try {
                const embedResponse = await fetch(video.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; embed-checker)'
                    },
                    timeout: 10000
                });
                
                if (embedResponse.ok) {
                    const embedContent = await embedResponse.text();
                    
                    if (embedContent.includes('Video unavailable') || 
                        embedContent.includes('not available') ||
                        embedContent.includes('removed')) {
                        console.log(`   ❌ Embed page shows unavailable`);
                    } else {
                        console.log(`   ✅ Embed page accessible`);
                        if (!result.available) {
                            result.available = true;
                            result.method = 'embed_page';
                        }
                    }
                }
            } catch (embedError) {
                console.log(`   ❌ Embed test failed: ${embedError.message}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        result.error = error.message;
    }
    
    // Final status
    if (result.available && result.loadable) {
        console.log(`   🎉 FULLY VERIFIED: Video loads properly`);
    } else if (result.available) {
        console.log(`   ⚠️  PARTIALLY VERIFIED: Video exists but loading uncertain`);
    } else {
        console.log(`   💀 FAILED VERIFICATION: Video not available`);
    }
    
    return result;
}

async function testAllVideosFromResponse14() {
    console.log('🧪 Comprehensive Video Loading Verification Test');
    console.log('📄 Testing videos from response-14 (Gemini + Google Search results)');
    console.log('🎯 Goal: Verify if videos actually load in browsers');
    console.log('=' .repeat(80));
    
    const results = [];
    
    for (let i = 0; i < videosFromResponse14.length; i++) {
        const result = await checkVideoLoading(videosFromResponse14[i], i);
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 COMPREHENSIVE RESULTS:');
    console.log('=' .repeat(80));
    
    const fullyVerified = results.filter(r => r.available && r.loadable);
    const partiallyVerified = results.filter(r => r.available && !r.loadable);
    const failed = results.filter(r => !r.available);
    
    console.log(`✅ Fully Verified (Loads properly): ${fullyVerified.length}/${results.length}`);
    console.log(`⚠️  Partially Verified (Exists but uncertain): ${partiallyVerified.length}/${results.length}`);
    console.log(`❌ Failed Verification (Not available): ${failed.length}/${results.length}`);
    console.log(`📈 Success Rate: ${((fullyVerified.length / results.length) * 100).toFixed(1)}%`);
    
    if (fullyVerified.length > 0) {
        console.log('\n🎉 VIDEOS THAT ACTUALLY LOAD:');
        fullyVerified.forEach((video, index) => {
            console.log(`${index + 1}. ${video.actualTitle || video.title}`);
            console.log(`   🔗 ${video.watchUrl}`);
            console.log(`   📊 Confidence: ${(video.confidence * 100)}% | Method: ${video.method}`);
            if (video.channel) console.log(`   👤 Channel: ${video.channel}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ VIDEOS THAT DON\'T LOAD:');
        failed.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title}`);
            console.log(`   🔗 ${video.watchUrl}`);
            console.log(`   ❌ Reason: ${video.error || 'Unknown'}`);
        });
    }
    
    // Compare with Google Search effectiveness
    console.log('\n🔍 GOOGLE SEARCH EFFECTIVENESS:');
    const googleSearchSuccessRate = (fullyVerified.length / results.length) * 100;
    
    if (googleSearchSuccessRate >= 60) {
        console.log(`🌟 EXCELLENT: ${googleSearchSuccessRate.toFixed(1)}% of videos actually load`);
        console.log('🔍 Google Search grounding is working very well!');
    } else if (googleSearchSuccessRate >= 40) {
        console.log(`👍 GOOD: ${googleSearchSuccessRate.toFixed(1)}% of videos actually load`);
        console.log('🔍 Google Search grounding is working reasonably well');
    } else {
        console.log(`⚠️  NEEDS IMPROVEMENT: Only ${googleSearchSuccessRate.toFixed(1)}% of videos actually load`);
        console.log('🔍 Google Search grounding needs refinement');
    }
    
    return googleSearchSuccessRate >= 40;
}

// Run the comprehensive test
testAllVideosFromResponse14().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});