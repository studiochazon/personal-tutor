# AI/LLM Development Rules

## Course Generation Guidelines

### System Prompt Compliance
- **ALWAYS** follow the course generation format defined in `system-prompt.md`
- Use the exact JSON structure for course responses
- Include video resources for each lesson when relevant
- Follow the lesson structure template (Introduction, Main Content, Practice)

### Content Quality Standards
- Create engaging, educational content that follows proven learning methodologies
- Structure courses with clear learning objectives
- Ensure progressive difficulty and logical flow
- Include practical examples and real-world applications
- Design for different learning styles (visual, auditory, kinesthetic)

### Video Integration
- Include relevant video sources (YouTube, Vimeo) for each lesson
- Choose high-quality, well-produced educational content
- Ensure videos are publicly accessible and have good audio quality
- Prefer videos of appropriate length (2-15 minutes for most lessons)
- Include different types of videos (tutorials, explanations, demonstrations)

## OpenAI API Integration

### API Usage Best Practices
- Implement proper rate limiting and error handling
- Use streaming responses for better user experience
- Cache responses when appropriate to reduce API costs
- Validate AI responses before using them in the application
- Handle API failures gracefully with fallback content

### Prompt Engineering
- Write clear, specific prompts that generate structured responses
- Use the system prompt for consistent course generation
- Include context about the user's learning goals and skill level
- Test prompts with different scenarios to ensure reliability
- Iterate on prompts based on generated content quality

### Response Processing
- Parse and validate JSON responses from the AI
- Handle malformed responses gracefully
- Extract and store video metadata properly
- Implement proper error handling for failed generations
- Log generation attempts for quality monitoring

## Database Integration

### Course Storage
- Store courses with proper relationships to lessons
- Include video metadata (URL, title, duration) in lesson records
- Implement proper indexing for course queries
- Use transactions for course creation to ensure data integrity
- Validate course data before database insertion

### Content Management
- Implement versioning for course content
- Allow for course updates and improvements
- Store generation metadata (prompt used, generation time)
- Track course popularity and user engagement
- Implement content moderation and quality checks

## Error Handling & Monitoring

### AI Service Failures
- Implement retry logic for transient API failures
- Provide meaningful error messages to users
- Log detailed error information for debugging
- Have fallback content for when AI generation fails
- Monitor API usage and costs

### Content Validation
- Validate generated content for educational value
- Check for inappropriate or low-quality content
- Ensure video links are still accessible
- Verify course structure meets quality standards
- Implement content review processes

## Performance Optimization

### Caching Strategy
- Cache frequently requested courses
- Implement intelligent cache invalidation
- Use CDN for video content when possible
- Cache AI responses to reduce API calls
- Optimize database queries for course retrieval

### User Experience
- Show loading states during course generation
- Provide progress indicators for long operations
- Allow users to save partial progress
- Implement offline capabilities where possible
- Optimize for mobile learning experiences

## Security & Privacy

### Data Protection
- Don't store sensitive user information in AI prompts
- Implement proper data anonymization
- Follow GDPR and privacy regulations
- Secure API keys and credentials
- Audit AI-generated content for security issues

### Content Safety
- Implement content filtering for inappropriate material
- Validate video sources for safety and appropriateness
- Monitor generated content for bias or harmful information
- Provide content warnings when necessary
- Allow users to report problematic content

## Testing & Quality Assurance

### AI Integration Testing
- Test course generation with various prompts
- Verify video integration works correctly
- Test error handling for API failures
- Validate content quality and educational value
- Test performance under load

### Content Validation
- Review generated courses for accuracy
- Verify video resources are relevant and accessible
- Test course progression and difficulty scaling
- Validate learning objectives are met
- Ensure accessibility standards are maintained 