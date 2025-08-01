#!/usr/bin/env node

/**
 * More robust YouTube video availability checker
 */

// Use Node.js built-in fetch if available, otherwise use node-fetch
let fetch;
try {
    fetch = globalThis.fetch;
} catch (e) {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
}

// Video URLs from Gemini's response
const videos = [
    { id: "G4t3g2239_c", title: "What Is Creationism?" },
    { id: "a-3X6V6_2wM", title: "A Brief History of Young Earth Creationism" },
    { id: "w5369-OobM4", title: "Young Earth vs. Old Earth Creationism: What's the Difference?" },
    { id: "G_igA_j362I", title: "The Lost World of Genesis One" },
    { id: "o-Q_94zR02s", title: "How Do We Know How Old The Earth Is?" },
    { id: "l33f9pI96as", title: "The Scopes Monkey Trial | A Reading Through History" },
    { id: "zV3gboA-a_I", title: "Science vs. God: A False Dichotomy" },
    { id: "bICEv_XbL3E", title: "Intelligent Design" }
];

async function checkVideoAvailability(video, index) {
    const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const embedUrl = `https://www.youtube.com/embed/${video.id}`;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    
    console.log(`\n${index + 1}. ${video.title}`);
    console.log(`   🔗 Video ID: ${video.id}`);
    
    try {
        // Method 1: Check oEmbed API (most reliable)
        try {
            const oembedResponse = await fetch(oembedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; video-checker)'
                }
            });
            
            if (oembedResponse.ok) {
                const oembedData = await oembedResponse.json();
                console.log(`   ✅ AVAILABLE via oEmbed`);
                console.log(`   📺 Title: ${oembedData.title}`);
                console.log(`   👤 Author: ${oembedData.author_name}`);
                console.log(`   🔗 Watch: ${watchUrl}`);
                console.log(`   📱 Embed: ${embedUrl}`);
                return { ...video, available: true, method: 'oembed', data: oembedData };
            }
        } catch (oembedError) {
            // oEmbed failed, try other methods
        }
        
        // Method 2: Check YouTube watch page
        const watchResponse = await fetch(watchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (watchResponse.ok) {
            const htmlContent = await watchResponse.text();
            
            // Check for common unavailability indicators
            const unavailableIndicators = [
                'Video unavailable',
                'This video is unavailable',
                'Private video',
                'This video is private',
                'Video removed',
                'This video has been removed',
                'Age-restricted',
                'Sign in to confirm your age'
            ];
            
            const hasUnavailableIndicator = unavailableIndicators.some(indicator => 
                htmlContent.toLowerCase().includes(indicator.toLowerCase())
            );
            
            if (hasUnavailableIndicator) {
                console.log(`   ❌ UNAVAILABLE - Video exists but is restricted/private/removed`);
                return { ...video, available: false, reason: 'restricted_or_private' };
            } else {
                console.log(`   ✅ LIKELY AVAILABLE via watch page`);
                console.log(`   🔗 Watch: ${watchUrl}`);
                console.log(`   📱 Embed: ${embedUrl}`);
                return { ...video, available: true, method: 'watch_page' };
            }
        } else {
            console.log(`   ❌ UNAVAILABLE - HTTP ${watchResponse.status}`);
            return { ...video, available: false, reason: `http_${watchResponse.status}` };
        }
        
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
        return { ...video, available: false, reason: 'network_error', error: error.message };
    }
}

async function findAlternativeCreationismVideos() {
    console.log('\n🔍 Searching for alternative creationism videos...');
    
    // Some known working creationism-related videos
    const alternatives = [
        { id: "8fF_7q3u1SU", title: "What is Biblical Creation?" },
        { id: "ZhHk3rFodls", title: "Young Earth vs Old Earth Creationism" },
        { id: "5MXTBGcyNuc", title: "Evolution vs Creation" },
        { id: "DhMBr_M8aTc", title: "The Creation Museum" },
        { id: "TQepVPqD9ks", title: "Biblical Worldview" }
    ];
    
    console.log('\n📺 Testing alternative videos:');
    const workingAlternatives = [];
    
    for (let i = 0; i < alternatives.length; i++) {
        const result = await checkVideoAvailability(alternatives[i], i);
        if (result.available) {
            workingAlternatives.push(result);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return workingAlternatives;
}

async function testAllVideos() {
    console.log('🧪 Comprehensive YouTube Video Availability Test');
    console.log('📚 Creationism Course Videos from Gemini 2.5 Pro');
    console.log('=' .repeat(80));
    
    const results = [];
    
    for (let i = 0; i < videos.length; i++) {
        const result = await checkVideoAvailability(videos[i], i);
        results.push(result);
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test alternatives if needed
    const workingVideos = results.filter(v => v.available);
    if (workingVideos.length < videos.length) {
        const alternatives = await findAlternativeCreationismVideos();
        console.log(`\n✅ Found ${alternatives.length} working alternative videos`);
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 FINAL RESULTS:');
    console.log('=' .repeat(80));
    
    const availableVideos = results.filter(v => v.available);
    const unavailableVideos = results.filter(v => !v.available);
    
    console.log(`✅ Available Videos: ${availableVideos.length}/${results.length}`);
    console.log(`❌ Unavailable Videos: ${unavailableVideos.length}/${results.length}`);
    console.log(`📈 Availability Rate: ${((availableVideos.length / results.length) * 100).toFixed(1)}%`);
    
    if (availableVideos.length > 0) {
        console.log('\n🎉 WORKING VIDEOS:');
        availableVideos.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title} (${video.id})`);
            console.log(`   🔗 https://www.youtube.com/watch?v=${video.id}`);
        });
    }
    
    if (unavailableVideos.length > 0) {
        console.log('\n❌ UNAVAILABLE VIDEOS:');
        unavailableVideos.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title} (${video.id})`);
            console.log(`   ❌ Reason: ${video.reason}`);
        });
    }
    
    return results;
}

// Run the comprehensive test
testAllVideos().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});