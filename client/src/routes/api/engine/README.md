# Engine API Documentation

The Engine API provides a set of modular, reusable educational content creation functions that can be mixed and matched to build custom learning experiences.

## Core APIs (Phase 1)

### 1. `/api/engine/llm_request`
**Purpose**: Centralized LLM request handling with logging
**Method**: POST

```typescript
Body: {
  model: string,
  messages: Array<{role: string, content: string}>,
  context: string,
  max_tokens?: number,
  temperature?: number,
  web_search_options?: object
}

Response: {
  success: boolean,
  response?: string,
  model?: string,
  log_id?: string,
  usage?: object,
  error?: string
}
```

### 2. `/api/engine/lesson_planning`
**Purpose**: Generate lesson plans and learning objectives
**Method**: POST

```typescript
Body: {
  topic: string,
  audience: "beginner" | "intermediate" | "advanced",
  depth: "overview" | "comprehensive" | "deep-dive",
  lessonCount?: number,
  duration?: number // Total course duration in minutes
}

Response: {
  success: boolean,
  lessons?: Array<{
    title: string,
    objectives: string[],
    duration: number,
    order: number,
    key_concepts: string[],
    prerequisites?: string[]
  }>,
  total_duration?: number,
  difficulty_level?: string,
  error?: string
}
```

### 3. `/api/engine/content_generation`
**Purpose**: Generate detailed lesson content with examples and exercises
**Method**: POST

```typescript
Body: {
  lesson_title: string,
  learning_objectives: string[],
  topic: string,
  audience: "beginner" | "intermediate" | "advanced",
  format: "markdown" | "html" | "text",
  duration?: number,
  include_examples?: boolean,
  include_exercises?: boolean,
  web_search?: boolean
}

Response: {
  success: boolean,
  generated_content?: {
    content: string,
    examples: string[],
    exercises: string[],
    key_points: string[],
    estimated_reading_time: number
  },
  format?: string,
  error?: string
}
```

### 4. `/api/engine/lesson_youtube_discovery`
**Purpose**: Discover relevant YouTube videos for lessons
**Method**: POST

```typescript
Body: {
  lessons: Array<{
    title: string,
    topic: string,
    duration?: number,
    audience?: string
  }>,
  courseTitle: string,
  preferred_duration?: number,
  quality_preference?: "educational" | "engaging" | "authoritative",
  max_retries?: number
}

Response: {
  success: boolean,
  videos?: Array<{
    lesson_index: number,
    video_url: string,
    video_title: string,
    video_duration: number,
    confidence_score: number,
    platform: string,
    was_replaced: boolean,
    fallback_reason?: string
  }>,
  total_lessons?: number,
  successful_matches?: number,
  error?: string
}
```

## Usage Examples

### Example 1: Complete Course Creation Workflow

```javascript
// 1. Plan the lessons
const lessonPlan = await fetch('/api/engine/lesson_planning', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'JavaScript Fundamentals',
    audience: 'beginner',
    depth: 'comprehensive',
    lessonCount: 6,
    duration: 120
  })
});

// 2. Generate content for each lesson
const lessons = lessonPlan.lessons;
const contentPromises = lessons.map(lesson => 
  fetch('/api/engine/content_generation', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lesson_title: lesson.title,
      learning_objectives: lesson.objectives,
      topic: 'JavaScript Fundamentals',
      audience: 'beginner',
      format: 'markdown',
      duration: lesson.duration,
      include_examples: true,
      include_exercises: true
    })
  })
);

// 3. Find YouTube videos
const videoDiscovery = await fetch('/api/engine/lesson_youtube_discovery', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lessons: lessons.map(lesson => ({
      title: lesson.title,
      topic: 'JavaScript Fundamentals',
      duration: lesson.duration,
      audience: 'beginner'
    })),
    courseTitle: 'JavaScript Fundamentals',
    preferred_duration: 10,
    quality_preference: 'educational'
  })
});
```

### Example 2: Custom Content with Web Search

```javascript
const currentContent = await fetch('/api/engine/content_generation', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lesson_title: 'React 18 New Features',
    learning_objectives: [
      'Understand concurrent features in React 18',
      'Learn about automatic batching',
      'Explore Suspense improvements'
    ],
    topic: 'React 18',
    audience: 'intermediate',
    format: 'markdown',
    web_search: true // Use current information from web
  })
});
```

## Authentication

All engine APIs require JWT authentication via the `Authorization` header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

All APIs return consistent error responses:
```typescript
{
  success: false,
  error: string
}
```

Common HTTP status codes:
- `401`: Authentication required
- `400`: Invalid request parameters
- `500`: Internal server error
- `503`: API quota exceeded

## Benefits

### Modularity
- Use individual functions for specific tasks
- Mix and match APIs for custom workflows
- Easy to test and debug individual components

### Flexibility
- Choose output formats (JSON, markdown, text, HTML)
- Control content depth and audience level
- Enable/disable specific features (examples, exercises, web search)

### Experimentation
- A/B test different content generation strategies
- Try different video discovery approaches
- Compare lesson planning methodologies

### Scalability
- Each API can be optimized independently
- Parallel processing of multiple requests
- Caching and performance optimization per function

## Future APIs (Planned)

- `/api/engine/course_structure_generation` - Generate complete course structures
- `/api/engine/video_validation` - Validate video URLs and provide fallbacks
- `/api/engine/prompt_engineering` - Generate optimized prompts
- `/api/engine/course_serialization` - Convert between formats
- `/api/engine/educational_assessment` - Generate quizzes and assessments