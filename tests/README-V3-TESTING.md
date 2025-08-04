# V3 Course Creation Engine Testing

Complete testing suite for the V3 Course Creation Engine with "Machine Learning from scratch" example.

## Quick Start

### 1. Check Environment
```bash
# Check if everything is set up correctly
node tests/check-test-environment.js

# Or make executable and run
chmod +x tests/check-test-environment.js
./tests/check-test-environment.js
```

### 2. Run V3 Engine Test
```bash
# Run the complete v3 engine test
node tests/test-v3-engine-complete.js

# Or make executable and run  
chmod +x tests/test-v3-engine-complete.js
./tests/test-v3-engine-complete.js
```

### 3. Check Results
```bash
# View the latest test results
ls -la logs/test-results/

# Read the human-readable summary
cat logs/test-results/*-summary.txt | tail -100

# Check LLM API logs
ls -la logs/llm/orchestrator_v3/
```

## What Gets Tested

### 🔄 8-Step V3 Engine Pipeline

1. **Course Plan Generation** - Creates lesson structure
2. **Keyword Cloud Generation** - Generates search keywords  
3. **Video Search** - Finds relevant YouTube videos
4. **Video Verification** - Validates video availability
5. **🆕 Artifact Generation** - Creates learning materials
6. **🆕 Artifact Prioritization** - Selects primary + supplementary content
7. **Course Plan Refinement** - Optimizes course structure
8. **Course Save** - ⏭️ Skipped (safe testing mode)

### 📊 Test Features

- **Safe Mode**: Database save skipped by default
- **Comprehensive Logging**: Every API call logged with details
- **Performance Metrics**: Timing and quality analytics
- **Artifact Analytics**: Content generation and prioritization stats
- **Result Persistence**: JSON data + human-readable summaries

## Test Configuration

### Course Settings
- **Topic**: "Machine Learning from scratch"
- **Audience**: Beginner
- **Depth**: Comprehensive
- **Lessons**: 6 lessons, 120 minutes total

### Artifact Settings
- **Types**: text, exercise, quiz, summary, checklist
- **Strategy**: Targeted generation
- **Max Supplementary**: 3 per lesson

## Expected Results

### ✅ Success Indicators
- All 8 steps complete successfully
- 6 lessons generated with complete artifact sets
- Each lesson has 1 primary + 2-3 supplementary artifacts
- High video coverage (>70%)
- Good artifact quality scores (>0.6)
- Total execution time under 60 seconds

### 📈 Sample Output
```
✅ V3 Engine Orchestrator: SUCCESS

📊 Execution Summary:
   Total Time: 28,547ms (28.5s)
   Steps Completed: 7
   Steps Failed: 0
   Artifacts Generated: 18
   Primary Artifacts: 6
   Supplementary Artifacts: 12

📚 Final Course Structure:
   Title: Course: Machine Learning from scratch
   Total Duration: 120 minutes
   Video Coverage: 83.3%
   Quality Score: 78.5%
   Lessons: 6
```

## File Outputs

### Test Results
- `logs/test-results/[timestamp]-v3-engine-test-results.json` - Complete API data
- `logs/test-results/[timestamp]-v3-engine-test-results-summary.txt` - Human summary

### LLM Logs  
- `logs/llm/orchestrator_v3/` - Main orchestrator calls
- `logs/llm/artifact_generation/` - Artifact creation logs
- `logs/llm/artifact_prioritization/` - Content selection logs
- `logs/llm/keyword_generation/` - Keyword generation
- `logs/llm/video_search/` - Video discovery
- `logs/llm/course_plan_refinement/` - Course optimization

Each API type gets both JSON metadata and readable text files.

## Troubleshooting

### ❌ Environment Check Fails

**Development Server**
```bash
# Start the dev server
npm run dev
# Should run on http://localhost:5173
```

**API Key Missing**
```bash
# Set in .env file
echo "OPENAI_API_KEY=your_key_here" >> .env

# Or export temporarily  
export OPENAI_API_KEY=your_key_here
```

**Authentication Issues**
```bash
# Check API endpoint
curl http://localhost:5173/api/test

# Should return: {"success":true,"message":"Server is working!"}
```

### ❌ V3 Engine Test Fails

**Step Failures**
- Check step results in console output
- Review error messages in test summary
- Examine LLM logs for API issues

**Performance Issues**
- Reduce lesson count: `lesson_count: 4`
- Use minimal strategy: `artifact_generation_strategy: 'minimal'`
- Lower quality threshold: `quality_threshold: 0.3`

**Network/API Issues**
- Verify internet connectivity
- Check OpenAI API status
- Monitor API rate limits

## Customizing Tests

Edit `tests/test-v3-engine-complete.js`:

```javascript
const requestBody = {
    // Change course topic
    user_prompt: 'Create a course about [YOUR TOPIC]',
    
    // Adjust complexity
    lesson_count: 4,           // Fewer lessons for faster testing
    audience: 'intermediate',   // Change difficulty
    depth: 'overview',         // Shorter content
    
    // Modify artifacts
    artifact_types: ['text', 'summary'], // Fewer types
    artifact_generation_strategy: 'minimal', // Faster generation
    
    // Enable database save
    skip_steps: [], // Remove 'course_save'
    auto_save: true,
}
```

## Performance Benchmarks

### Typical Execution Times
- **Total**: 25-45 seconds
- **Course Planning**: 2-4 seconds  
- **Keyword Generation**: 1-3 seconds
- **Video Search**: 3-8 seconds
- **Artifact Generation**: 8-15 seconds (largest step)
- **Artifact Prioritization**: 1-2 seconds
- **Course Refinement**: 2-5 seconds

### Quality Metrics
- **Artifact Quality**: 70-85% average
- **Video Coverage**: 70-90%
- **Content Completeness**: 85-95%

## Next Steps

### After Successful Test ✅
1. **Enable Database Save** - Remove `course_save` from `skip_steps`
2. **Try Different Topics** - Test various course subjects
3. **Experiment with Strategies** - Try comprehensive vs minimal
4. **Production Testing** - Test with real authentication
5. **Integration Testing** - Test with frontend UI

### Production Deployment Checklist
- [ ] All environment checks pass
- [ ] V3 engine test completes successfully  
- [ ] Database migration executed (`database-migrations/add-artifacts-system.sql`)
- [ ] Logging directories configured
- [ ] API rate limits configured
- [ ] Monitoring and alerts set up

---

**💡 Tip**: Run the environment check first every time to ensure everything is properly configured before running the full v3 engine test.