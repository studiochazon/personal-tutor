#!/usr/bin/env node

/**
 * Test script to check which YouTube video URLs are working
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
    {
        lesson: "Introduction to Creationism",
        url: "https://www.youtube.com/embed/G4t3g2239_c",
        title: "What Is Creationism?",
        confidence: 1.0
    },
    {
        lesson: "Historical Development of Creationist Beliefs",
        url: "https://www.youtube.com/embed/a-3X6V6_2wM",
        title: "A Brief History of Young Earth Creationism",
        confidence: 0.9
    },
    {
        lesson: "Forms of Creationism",
        url: "https://www.youtube.com/embed/w5369-OobM4",
        title: "Young Earth vs. Old Earth Creationism: What's the Difference?",
        confidence: 1.0
    },
    {
        lesson: "Theological Foundations of Creationist Beliefs",
        url: "https://www.youtube.com/embed/G_igA_j362I",
        title: "The Lost World of Genesis One",
        confidence: 0.95
    },
    {
        lesson: "Scientific Critiques of Creationism",
        url: "https://www.youtube.com/embed/o-Q_94zR02s",
        title: "How Do We Know How Old The Earth Is?",
        confidence: 0.9
    },
    {
        lesson: "Legal Battles and Educational Implications",
        url: "https://www.youtube.com/embed/l33f9pI96as",
        title: "The Scopes Monkey Trial | A Reading Through History",
        confidence: 1.0
    },
    {
        lesson: "Cultural and Societal Impacts",
        url: "https://www.youtube.com/embed/zV3gboA-a_I",
        title: "Science vs. God: A False Dichotomy | Dr. Ian Hutchinson | University of Toronto",
        confidence: 0.9
    },
    {
        lesson: "Contemporary Perspectives and Future Directions",
        url: "https://www.youtube.com/embed/bICEv_XbL3E",
        title: "Intelligent Design",
        confidence: 0.95
    }
];

async function testVideoUrl(video, index) {
    const videoId = video.url.split('/embed/')[1];
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
        console.log(`\n${index + 1}. Testing: ${video.title}`);
        console.log(`   🔗 Video ID: ${videoId}`);
        console.log(`   📊 Confidence: ${(video.confidence * 100)}%`);
        
        // Test the YouTube watch page
        const response = await fetch(watchUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; test-bot)'
            }
        });
        
        if (response.ok) {
            console.log(`   ✅ WORKING - ${watchUrl}`);
            console.log(`   📺 Embed URL: ${video.url}`);
            return { ...video, working: true, watchUrl };
        } else {
            console.log(`   ❌ NOT WORKING - Status: ${response.status}`);
            return { ...video, working: false, watchUrl };
        }
        
    } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
        return { ...video, working: false, error: error.message, watchUrl };
    }
}

async function testAllVideos() {
    console.log('🧪 Testing Gemini-discovered YouTube URLs for Creationism Course');
    console.log('=' .repeat(80));
    
    const results = [];
    
    for (let i = 0; i < videos.length; i++) {
        const result = await testVideoUrl(videos[i], i);
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 SUMMARY RESULTS:');
    console.log('=' .repeat(80));
    
    const workingVideos = results.filter(v => v.working);
    const notWorkingVideos = results.filter(v => !v.working);
    
    console.log(`✅ Working Videos: ${workingVideos.length}/${results.length}`);
    console.log(`❌ Not Working Videos: ${notWorkingVideos.length}/${results.length}`);
    console.log(`📈 Success Rate: ${((workingVideos.length / results.length) * 100).toFixed(1)}%`);
    
    if (workingVideos.length > 0) {
        console.log('\n🎉 WORKING VIDEOS:');
        workingVideos.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title}`);
            console.log(`   🔗 ${video.watchUrl}`);
            console.log(`   📱 Embed: ${video.url}`);
        });
    }
    
    if (notWorkingVideos.length > 0) {
        console.log('\n❌ NOT WORKING VIDEOS:');
        notWorkingVideos.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title}`);
            console.log(`   🔗 ${video.watchUrl}`);
        });
    }
    
    return results;
}

// Run the test
testAllVideos().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});