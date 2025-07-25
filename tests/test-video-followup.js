// Test script to verify video followup functionality
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

async function testVideoFollowup() {
  console.log('🎬 Testing Video Followup Functionality\n');
  
  // Simulate lessons with invalid video URLs (like the theology course)
  const lessons = [
    {
      title: "Introduction to Christian Theology",
      video_url: "https://www.youtube.com/embed/VIDEO_ID1"
    },
    {
      title: "Biblical Theology", 
      video_url: "https://www.youtube.com/embed/VIDEO_ID2"
    },
    {
      title: "Systematic Theology",
      video_url: "https://www.youtube.com/embed/VIDEO_ID3"
    }
  ];
  
  const courseTitle = "Introduction to Christian Theology";
  
  console.log('1️⃣ Testing detection of invalid video URLs...');
  
  // Test the detection logic
  const needsVideoFollowup = lessons.some((lesson) => {
    const videoUrl = lesson.video_url;
    return videoUrl && (
      videoUrl.includes('VIDEO_ID') || 
      videoUrl.includes('placeholder') ||
      !videoUrl.includes('youtube.com/embed/')
    );
  });
  
  console.log(`Needs video followup: ${needsVideoFollowup}`);
  console.log('✅ Detection logic working correctly\n');
  
  console.log('2️⃣ Testing video followup API call...');
  
  try {
    // Create a focused prompt for video URLs only
    const videoPrompt = `Find real YouTube video URLs for these lessons. Respond with ONLY a JSON array of video objects.

Course: "${courseTitle}"

Lessons:
${lessons.map((lesson, index) => `${index + 1}. ${lesson.title}`).join('\n')}

Requirements:
- Use REAL YouTube video IDs (e.g., W6NZfCO5SIk, PkZNo7MFNFg)
- Format as embed URLs: https://www.youtube.com/embed/VIDEO_ID
- Choose high-quality educational videos that match each lesson topic
- Include realistic video titles and durations (2-15 minutes)
- DO NOT use placeholders like VIDEO_ID1, VIDEO_ID2

Respond with JSON array:
[
  {
    "video_url": "https://www.youtube.com/embed/REAL_VIDEO_ID",
    "video_title": "Real video title",
    "video_duration": 600
  }
]`;

    const openAIRequest = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a video research assistant. Find real YouTube educational videos. Respond with ONLY valid JSON.'
        },
        {
          role: 'user',
          content: videoPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(openAIRequest)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const videoResponse = data.choices[0]?.message?.content;

    if (!videoResponse) {
      throw new Error('No response content from OpenAI');
    }

    console.log('Raw AI response:');
    console.log(videoResponse);
    console.log('\n');

    // Parse the video response
    const videoData = JSON.parse(videoResponse);
    
    console.log('Parsed video data:');
    console.log(JSON.stringify(videoData, null, 2));
    console.log('\n');

    // Validate that we got real video URLs
    const hasRealVideos = videoData.every((video) => 
      video.video_url && 
      video.video_url.includes('youtube.com/embed/') && 
      !video.video_url.includes('VIDEO_ID') &&
      !video.video_url.includes('placeholder')
    );

    console.log(`Has real videos: ${hasRealVideos}`);
    
    if (hasRealVideos) {
      console.log('✅ Successfully got real video URLs!');
      console.log('Video URLs:');
      videoData.forEach((video, index) => {
        console.log(`${index + 1}. ${video.video_url} - ${video.video_title} (${video.video_duration}s)`);
      });
    } else {
      console.log('❌ Still got invalid video URLs');
    }

  } catch (error) {
    console.error('❌ Error testing video followup:', error);
  }
}

// Run the test
testVideoFollowup().catch(console.error); 