import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development' 
});

export interface LessonPlan {
  title: string;
  content: string;
  videoUrl?: string;
}

export interface CoursePlan {
  title: string;
  description: string;
  lessons: LessonPlan[];
}

export async function generateCourseFromTopic(topic: string): Promise<CoursePlan> {
  // Check if we have a valid OpenAI API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Return a mock course for development/testing
    return {
      title: `Learn ${topic}`,
      description: `A comprehensive course about ${topic} created with AI. Add your OpenAI API key to generate real courses.`,
      lessons: [
        {
          title: `Introduction to ${topic}`,
          content: `This is a placeholder lesson about ${topic}. To generate real content, please add your OpenAI API key to the .env file.`,
          videoUrl: undefined
        },
        {
          title: `Advanced ${topic} Concepts`,
          content: `This lesson covers advanced concepts in ${topic}. Real AI-generated content will be available once you configure your API key.`,
          videoUrl: undefined
        }
      ]
    };
  }

  const prompt = `Create a comprehensive learning course about "${topic}".\n\nReturn a JSON object with the following structure:\n{\n  title: string,\n  description: string,\n  lessons: [\n    { title: string, content: string, videoUrl?: string }\n  ]\n}\n\nRequirements:\n- Create 5-8 lessons that progress from basic to advanced\n- Each lesson should be comprehensive and educational\n- Include practical examples and explanations\n- Make the content engaging and easy to understand\n- Focus on the most important aspects of ${topic}\n- If you know a good YouTube video for a lesson, include its URL as videoUrl\n\nReturn only the JSON object, no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');
    // Try to parse the JSON (strip code block if present)
    const json = response.trim().replace(/^```json|```$/g, '').trim();
    const coursePlan: CoursePlan = JSON.parse(json);

    // Enhance with YouTube video search if missing
    const enhancedLessons = await Promise.all(
      coursePlan.lessons.map(async (lesson) => {
        if (!lesson.videoUrl) {
          const videoUrl = await searchYouTubeVideo(`${topic} ${lesson.title}`);
          return { ...lesson, videoUrl };
        }
        return lesson;
      })
    );
    return { ...coursePlan, lessons: enhancedLessons };
  } catch (error) {
    console.error('Error generating course:', error);
    throw new Error('Failed to generate course content');
  }
}

async function searchYouTubeVideo(query: string): Promise<string | undefined> {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('YouTube API key not configured');
      return undefined;
    }
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${apiKey}`
    );
    const videoId = response.data.items?.[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return undefined;
  }
} 