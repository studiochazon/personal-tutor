# Course Creation Engine v3

A sophisticated, modular course creation system that implements the 6-step algorithm for creating video-enhanced educational courses.

## Algorithm Overview

The v3 engine follows this precise workflow:
1. **Generate course plan** - Create structured lesson plans
2. **Generate keyword cloud** - Extract strategic keywords for video discovery
3. **Search videos** - Use keyword cloud for comprehensive video search
4. **Verify videos** - Validate availability and quality of discovered videos
5. **Refine course plan** - Regenerate course structure with video integration
6. **Save course** - Store finalized course in database

## API Endpoints

### 🎯 Main Entry Point

#### `/api/engine/v3/orchestrator`
**Purpose**: Complete course creation using all 6 steps
**Method**: POST

```typescript
// Request
{
  "user_prompt": "Create a course about machine learning for beginners",
  "audience": "beginner" | "intermediate" | "advanced",
  "depth": "overview" | "comprehensive" | "deep-dive",
  
  // Optional configuration
  "lesson_count": 6,
  "duration": 90, // Total course duration in minutes
  "preferred_video_duration": 8,
  "quality_preference": "educational" | "engaging" | "authoritative",
  
  // Strategy configuration
  "keyword_strategy": "comprehensive" | "targeted" | "mixed",
  "search_strategy": "comprehensive" | "targeted" | "mixed", 
  "refinement_strategy": "optimize_for_videos" | "maintain_structure" | "balanced",
  
  // Options
  "enable_fallbacks": true,
  "quality_threshold": 0.4,
  "max_videos_per_lesson": 2,
  "auto_save": true,
  "auto_publish": false,
  "create_enrollment": true,
  
  // Debug options
  "step_by_step": false,
  "skip_steps": []
}

// Response
{
  "success": boolean,
  "course_id": number,
  "execution_summary": {
    "total_execution_time_ms": number,
    "steps_completed": number,
    "steps_failed": number,
    "final_status": "completed" | "partial" | "failed"
  },
  "step_results": StepResult[], // If step_by_step: true
  "final_course": RefinedCourse,
  "error": string
}
```

### 🧩 Individual Step APIs

#### 1. `/api/engine/v3/keyword_generation`
Generate strategic keyword cloud from structured course plan or raw course text.

**Method**: POST - Generate keywords from structured lesson data
```typescript
// Request
{
  "course_title": "Machine Learning Fundamentals",
  "course_topic": "machine learning",
  "lessons": Lesson[],
  "audience": "beginner",
  "depth": "comprehensive"
}

// Response  
{
  "success": boolean,
  "keyword_cloud": {
    "primary_keywords": string[],      // 5-8 core keywords
    "secondary_keywords": string[],    // 10-15 supporting terms
    "long_tail_keywords": string[],    // 15-20 specific phrases
    "video_search_terms": string[],    // 20-30 video-optimized terms
    "excluded_terms": string[]         // Terms to avoid
  },
  "total_keywords": number
}
```

**Method**: PATCH - Extract keywords from raw course plan text
```typescript
// Request
{
  "course_plan_text": "Full course plan text content...",
  "audience": "intermediate",         // Optional, defaults to 'intermediate'
  "depth": "comprehensive"            // Optional, defaults to 'comprehensive'
}

// Response  
{
  "success": boolean,
  "keyword_cloud": {
    "primary_keywords": string[],      // 5-8 core keywords extracted from text
    "secondary_keywords": string[],    // 10-15 supporting terms
    "long_tail_keywords": string[],    // 15-20 specific phrases from content
    "video_search_terms": string[],    // 20-30 video-optimized terms
    "excluded_terms": string[]         // Terms to avoid in searches
  },
  "total_keywords": number,
  "log_id": "course_plan_extraction"
}
```

#### 2. `/api/engine/v3/video_search`
Search videos using keyword cloud strategy.

```typescript
// Request
{
  "course_title": "Machine Learning Fundamentals",
  "course_topic": "machine learning", 
  "lessons": Lesson[],
  "keyword_cloud": KeywordCloud,
  "audience": "beginner",
  "search_strategy": "mixed",
  "max_videos_per_lesson": 2
}

// Response
{
  "success": boolean,
  "search_results": VideoSearchResult[],
  "total_videos_found": number,
  "keyword_coverage": {
    "primary_used": number,
    "secondary_used": number,
    "long_tail_used": number,
    "video_terms_used": number
  }
}
```

#### 3. `/api/engine/v3/video_verification`
Verify video availability and quality.

```typescript
// Request
{
  "videos": VideoToVerify[],
  "course_title": "Machine Learning Fundamentals",
  "course_topic": "machine learning",
  "quality_threshold": 0.4,
  "enable_fallbacks": true
}

// Response
{
  "success": boolean,
  "verification_results": VerificationResult[],
  "summary": {
    "total_videos": number,
    "verified_available": number,
    "replaced_with_fallbacks": number,
    "failed_verification": number,
    "average_quality_score": number,
    "average_accessibility_score": number
  },
  "recommendations": string[]
}
```

#### 4. `/api/engine/v3/course_plan_refinement`
Regenerate course plan with video integration.

```typescript
// Request
{
  "course_title": "Machine Learning Fundamentals",
  "course_topic": "machine learning",
  "audience": "beginner",
  "depth": "comprehensive", 
  "original_lessons": Lesson[],
  "verified_videos": VerificationResult[],
  "refinement_strategy": "balanced"
}

// Response
{
  "success": boolean,
  "refined_course": {
    "title": string,
    "topic": string,
    "lessons": RefinedLesson[],
    "total_duration": number,
    "video_coverage": number,
    "quality_score": number
  },
  "refinement_summary": {
    "lessons_optimized": number,
    "lessons_restructured": number,
    "videos_integrated": number,
    "recommendations": string[]
  }
}
```

#### 5. `/api/engine/v3/course_save`
Save finalized course to database.

```typescript
// Request
{
  "course_data": RefinedCourse,
  "metadata": {
    "audience": "beginner",
    "depth": "comprehensive",
    "creation_method": "v3_engine",
    "engine_version": "3.0"
  },
  "creation_context": {
    "user_prompt": string,
    "generation_timestamp": string,
    "total_videos_found": number,
    "videos_integrated": number
  },
  "save_options": {
    "auto_publish": boolean,
    "create_enrollment": boolean
  }
}

// Response
{
  "success": boolean,
  "course_id": number,
  "course_details": CourseDetails,
  "database_operations": {
    "course_created": boolean,
    "lessons_created": number,
    "videos_linked": number,
    "metadata_saved": boolean
  }
}
```

## Usage Examples

### Simple Course Creation
```typescript
const response = await fetch('/api/engine/v3/orchestrator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    user_prompt: "Create a course about web development for beginners",
    audience: "beginner",
    depth: "comprehensive"
  })
});

const result = await response.json();
console.log(`Course created with ID: ${result.course_id}`);
```

### Advanced Configuration
```typescript
const response = await fetch('/api/engine/v3/orchestrator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    user_prompt: "Advanced JavaScript concepts for experienced developers",
    audience: "advanced",
    depth: "deep-dive",
    lesson_count: 8,
    duration: 120,
    keyword_strategy: "comprehensive",
    search_strategy: "targeted",
    refinement_strategy: "optimize_for_videos",
    quality_threshold: 0.6,
    max_videos_per_lesson: 3,
    step_by_step: true, // Get detailed step results
    auto_publish: true
  })
});
```

### Step-by-Step Processing
```typescript
// Step 1: Generate course plan
const planResponse = await fetch('/api/engine/lesson_planning', {
  method: 'POST',
  headers: { /* auth headers */ },
  body: JSON.stringify({
    topic: "React development",
    audience: "intermediate", 
    depth: "comprehensive"
  })
});

// Step 2: Generate keywords
const keywordsResponse = await fetch('/api/engine/v3/keyword_generation', {
  method: 'POST', 
  headers: { /* auth headers */ },
  body: JSON.stringify({
    course_title: "React Development Course",
    course_topic: "React development",
    lessons: planResponse.lessons,
    audience: "intermediate",
    depth: "comprehensive"
  })
});

        // Continue with remaining steps...
        ```

### Course Plan Text Keyword Extraction
```typescript
// Extract keywords from raw course plan text (like from llm-logs)
const coursePlanText = `
=== SIMPLE COURSE CREATION LOG ===
**Course Title: Understanding Creationism...**
[Full course plan content]
`;

const response = await fetch('/api/engine/v3/keyword_generation', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    course_plan_text: coursePlanText,
    audience: 'intermediate',
    depth: 'comprehensive'
  })
});

const keywords = await response.json();
console.log('Extracted keywords:', keywords.keyword_cloud);

// Use keywords for content discovery
keywords.keyword_cloud.video_search_terms.forEach(term => {
  // Search YouTube, educational platforms, etc.
  console.log(`Searching for: ${term}`);
});
```

## Strategy Configuration

### Keyword Strategies
- **comprehensive**: Use all keyword categories extensively
- **targeted**: Focus on primary and secondary keywords
- **mixed**: Balance between comprehensive and targeted

### Search Strategies  
- **comprehensive**: Cast wide net using all keywords
- **targeted**: More selective, higher quality matches
- **mixed**: Balance coverage and selectivity

### Refinement Strategies
- **optimize_for_videos**: Restructure around available videos
- **maintain_structure**: Keep original structure, add videos
- **balanced**: Moderate restructuring for video integration

## Quality Thresholds

- **0.8-1.0**: Excellent video matches
- **0.6-0.7**: Good quality videos  
- **0.4-0.5**: Acceptable fallbacks
- **Below 0.4**: Consider exclusion

## Error Handling

All APIs return consistent error responses:
```typescript
{
  "success": false,
  "error": "Descriptive error message",
  "step_results": [], // For orchestrator
  "execution_summary": {} // For orchestrator
}
```

Common error codes:
- **401**: Authentication required
- **400**: Invalid request parameters
- **429**: Rate limit exceeded
- **500**: Internal server error

## Database Schema Requirements

The v3 engine requires these database tables:
- `courses` - Course metadata
- `lessons` - Lesson content and structure
- `lesson_videos` - Video integration data
- `course_metadata` - v3 engine metadata
- `enrollments` - User enrollments (optional)

## Performance Considerations

- Full orchestrator execution: 30-60 seconds
- Individual steps: 3-10 seconds each
- Video verification: Depends on number of videos
- Parallel processing: Not yet implemented
- Caching: Keyword clouds could be cached

## Monitoring and Debugging

Use the `step_by_step: true` option to get detailed execution information for debugging and monitoring the course creation process.