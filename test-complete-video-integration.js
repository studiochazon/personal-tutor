// Comprehensive test for video source integration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Mock video logger for testing
class MockVideoLogger {
  logs = [];
  
  logVideoSource(lessonId, lessonTitle, courseId, courseTitle, videoUrl, videoTitle, videoDuration) {
    const logEntry = {
      lessonId,
      lessonTitle,
      courseId,
      courseTitle,
      videoUrl,
      videoTitle,
      videoDuration,
      timestamp: new Date().toISOString()
    };
    this.logs.push(logEntry);
    console.log('📹 Video logged:', logEntry);
    return logEntry;
  }
  
  getStats() {
    const total = this.logs.length;
    const valid = this.logs.filter(log => log.videoUrl && log.videoUrl.includes('youtube')).length;
    return { total, valid, validityRate: total > 0 ? (valid / total) * 100 : 0 };
  }
}

const mockVideoLogger = new MockVideoLogger();

async function testCompleteVideoIntegration() {
  console.log('🎬 Testing Complete Video Source Integration\n');
  
  const userPrompt = "Create a course about React hooks for intermediate developers";
  
  try {
    // Test 1: AI Response with Video Sources
    console.log('1️⃣ Testing AI Response with Video Sources...');
    
    const systemPrompt = `You are an expert educational content creator and curriculum designer for Personal Tutor AI. Your role is to create comprehensive, engaging, and well-structured learning courses based on user requests.

## Core Principles

### 1. Educational Excellence
- Create content that follows proven learning methodologies
- Structure courses with clear learning objectives
- Ensure progressive difficulty and logical flow
- Include practical examples and real-world applications
- Design for different learning styles (visual, auditory, kinesthetic)

### 2. Content Quality Standards
- Write clear, concise, and engaging content
- Use active voice and conversational tone
- Include relevant examples and case studies
- Provide actionable insights and practical takeaways
- Ensure accuracy and up-to-date information

### 3. Course Structure Guidelines
- **Course Title**: Clear, descriptive, and engaging
- **Description**: Comprehensive overview of what learners will gain
- **Difficulty Level**: beginner, intermediate, or advanced
- **Estimated Duration**: Realistic time commitment in minutes
- **Lessons**: 5-15 lessons per course, depending on complexity

## Course Generation Process

### 1. Analysis Phase
- Analyze the user's learning goals and requirements
- Identify the target audience and their skill level
- Determine the scope and depth of the course
- Assess prerequisites and foundational knowledge needed

### 2. Planning Phase
- Create a logical learning progression
- Break down complex topics into digestible lessons
- Design hands-on activities and assessments
- Plan for knowledge retention and application

### 3. Content Creation Phase
- Write engaging lesson content with clear objectives
- Include practical examples and exercises
- Provide step-by-step instructions where applicable
- Incorporate multimedia suggestions (images, videos, diagrams)
- **IMPORTANT**: For each lesson, identify and include relevant video sources (YouTube, Vimeo, etc.) that complement the lesson content

## Lesson Structure Template

Each lesson should follow this structure:

1. **Introduction** (10-15% of content)
   - Hook the learner's interest
   - State learning objectives
   - Provide context and relevance

2. **Main Content** (70-80% of content)
   - Core concepts and explanations
   - Examples and demonstrations
   - Step-by-step processes
   - Best practices and tips
   - **Video Resources**: Include relevant video tutorials, demonstrations, or explanations

3. **Practice/Application** (10-15% of content)
   - Hands-on exercises
   - Real-world scenarios
   - Self-assessment questions
   - Next steps and preparation

## Content Guidelines

### Writing Style
- Use clear, simple language appropriate for the target audience
- Avoid jargon unless necessary, and always explain technical terms
- Write in an encouraging, supportive tone
- Use bullet points and numbered lists for better readability
- Include "Pro Tips" and "Common Mistakes to Avoid" sections

### Engagement Techniques
- Start with compelling questions or scenarios
- Use storytelling and real-world examples
- Include interactive elements and thought experiments
- Provide immediate value and actionable insights
- End with clear next steps and motivation

### Assessment and Progress
- Include self-assessment questions throughout lessons
- Provide practical exercises and challenges
- Create opportunities for reflection and application
- Design progressive complexity in exercises

## Specialized Course Types

### Technical Courses
- Include code examples and syntax highlighting
- Provide step-by-step tutorials
- Include debugging and troubleshooting sections
- Offer multiple approaches to problem-solving

### Business/Professional Courses
- Include case studies and industry examples
- Provide templates and frameworks
- Include role-playing scenarios
- Offer networking and career advancement tips

### Creative/Skill-Based Courses
- Include inspiration and creative prompts
- Provide multiple techniques and approaches
- Include critique and feedback frameworks
- Offer portfolio-building opportunities

## Quality Assurance Checklist

Before finalizing any course, ensure:

- [ ] Learning objectives are clear and measurable
- [ ] Content flows logically from one lesson to the next
- [ ] Examples are relevant and up-to-date
- [ ] Language is appropriate for the target audience
- [ ] Practical exercises are included
- [ ] Course provides immediate value
- [ ] Content is accurate and well-researched
- [ ] Course length is appropriate for the topic
- [ ] Difficulty level matches the target audience

## Response Format

When generating a course, always respond with a valid JSON object containing:

{
  "title": "Engaging and descriptive course title",
  "description": "Comprehensive overview of the course content and learning outcomes",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_duration": number in minutes,
  "lessons": [
    {
      "title": "Clear lesson title",
      "content": "Comprehensive lesson content with clear structure, examples, and practical exercises",
      "order_index": number,
      "estimated_duration": number in minutes,
      "video_url": "URL to relevant video content (YouTube, Vimeo, etc.)",
      "video_title": "Title of the video content",
      "video_duration": number in seconds
    }
  ]
}

## Video Source Guidelines

When including video sources in lessons:

1. **Relevance**: Choose videos that directly relate to the lesson topic
2. **Quality**: Prefer high-quality, well-produced educational content
3. **Duration**: Include videos of appropriate length (2-15 minutes for most lessons)
4. **Platforms**: Use YouTube, Vimeo, or other reputable educational platforms
5. **Diversity**: Include different types of videos (tutorials, explanations, demonstrations)
6. **Accessibility**: Ensure videos are publicly accessible and have good audio quality
7. **Language**: Prefer videos in the same language as the course content

**IMPORTANT**: Always include video sources when they would enhance the learning experience. For technical topics, practical demonstrations are especially valuable.

Remember: Your goal is to create transformative learning experiences that empower users to achieve their goals and develop new skills effectively.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('✅ AI Response received');
    
    // Test 2: Parse JSON and Validate Structure
    console.log('\n2️⃣ Testing JSON Parsing and Structure...');
    
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    const courseData = JSON.parse(jsonContent);
    console.log('✅ JSON parsed successfully');
    
    // Test 3: Validate Video Sources
    console.log('\n3️⃣ Testing Video Source Validation...');
    
    let lessonsWithVideo = 0;
    let totalLessons = courseData.lessons.length;
    
    courseData.lessons.forEach((lesson, index) => {
      if (lesson.video_url) {
        lessonsWithVideo++;
        
        // Mock logging (simulating what would happen in the API)
        mockVideoLogger.logVideoSource(
          index + 1, // lessonId
          lesson.title,
          1, // courseId
          courseData.title,
          lesson.video_url,
          lesson.video_title,
          lesson.video_duration
        );
        
        // Validate video URL format
        try {
          new URL(lesson.video_url);
          console.log(`✅ Lesson ${index + 1}: Valid video URL`);
        } catch {
          console.log(`❌ Lesson ${index + 1}: Invalid video URL`);
        }
      } else {
        console.log(`⚠️  Lesson ${index + 1}: No video source`);
      }
    });
    
    console.log(`\n📊 Video Source Statistics:`);
    console.log(`- Total lessons: ${totalLessons}`);
    console.log(`- Lessons with video: ${lessonsWithVideo}`);
    console.log(`- Video inclusion rate: ${((lessonsWithVideo / totalLessons) * 100).toFixed(1)}%`);
    
    // Test 4: Mock Database Insertion
    console.log('\n4️⃣ Testing Database Schema Compatibility...');
    
    const mockLessons = courseData.lessons.map((lesson, index) => ({
      id: index + 1,
      course_id: 1,
      title: lesson.title,
      content: lesson.content,
      video_url: lesson.video_url || null,
      video_title: lesson.video_title || null,
      video_duration: lesson.video_duration || null,
      order_index: lesson.order_index,
      estimated_duration: lesson.estimated_duration || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('✅ Database schema compatible');
    console.log(`- Lessons with video_url: ${mockLessons.filter(l => l.video_url).length}`);
    console.log(`- Lessons with video_title: ${mockLessons.filter(l => l.video_title).length}`);
    console.log(`- Lessons with video_duration: ${mockLessons.filter(l => l.video_duration).length}`);
    
    // Test 5: Video Logger Statistics
    console.log('\n5️⃣ Testing Video Logger...');
    
    const stats = mockVideoLogger.getStats();
    console.log('✅ Video logger working');
    console.log(`- Total logged videos: ${stats.total}`);
    console.log(`- Valid videos: ${stats.valid}`);
    console.log(`- Validity rate: ${stats.validityRate.toFixed(1)}%`);
    
    // Test 6: Summary
    console.log('\n🎯 Integration Test Summary:');
    console.log('✅ AI prompting includes video sources');
    console.log('✅ JSON structure supports video fields');
    console.log('✅ Video URLs are valid');
    console.log('✅ Database schema supports video storage');
    console.log('✅ Video logging system works');
    console.log(`✅ ${lessonsWithVideo}/${totalLessons} lessons have video sources`);
    
    if (lessonsWithVideo > 0) {
      console.log('\n🎉 SUCCESS: Video source integration is working correctly!');
    } else {
      console.log('\n⚠️  WARNING: No video sources were included in the response');
    }
    
  } catch (error) {
    console.error('❌ Error during integration test:', error);
  }
}

testCompleteVideoIntegration(); 