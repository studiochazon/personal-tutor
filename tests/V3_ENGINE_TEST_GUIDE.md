# V3 Course Creation Engine Test Guide

## Overview

This guide explains how to test the complete V3 Course Creation Engine with comprehensive logging and analysis.

## Test Script: `test-v3-engine-complete.js`

Tests the full 8-step v3 engine pipeline with "Machine Learning from scratch" as the course topic.

### Features

- **End-to-End Testing**: Tests all 8 steps of the v3 engine
- **Comprehensive Logging**: Detailed logs for each API call
- **Database-Safe**: Skips database save but generates complete course structure
- **Detailed Analytics**: Tracks artifacts, quality scores, and performance
- **Result Persistence**: Saves both JSON data and human-readable summaries

## Running the Test

### Prerequisites

1. **Development Server Running**
   ```bash
   npm run dev
   # Server should be running on http://localhost:5173
   ```

2. **Environment Variables**
   ```bash
   # Ensure OPENAI_API_KEY is set in your .env file
   echo $OPENAI_API_KEY  # Should show your API key
   ```

3. **Database Connection** (optional for this test)
   ```bash
   # Not required since we skip database save, but good to have working
   npm run test:db
   ```

### Execute Test

```bash
# From project root
node tests/test-v3-engine-complete.js

# Or make it executable and run directly
chmod +x tests/test-v3-engine-complete.js
./tests/test-v3-engine-complete.js
```

## Test Configuration

The test is configured with the following parameters:

### Course Setup
- **Topic**: "Machine Learning from scratch"
- **Audience**: Beginner
- **Depth**: Comprehensive
- **Lessons**: 6 lessons
- **Duration**: 120 minutes total
- **Video Duration**: 10 minutes preferred

### Artifact Configuration
- **Types**: text, exercise, quiz, summary, checklist
- **Strategy**: Targeted generation
- **Max Supplementary**: 3 per lesson
- **Quality Threshold**: 0.5

### Engine Configuration
- **Keyword Strategy**: Mixed
- **Search Strategy**: Mixed
- **Refinement Strategy**: Balanced
- **Fallbacks**: Enabled
- **Step-by-Step**: Enabled (detailed logging)
- **Skip Steps**: course_save (database save)

## Expected Output

### Console Output

The test will show:

1. **Configuration Summary**
   ```
   📚 Course Topic: "Machine Learning from scratch"
   📊 Test Configuration:
      Lessons: 6
      Duration: 120 minutes
      Audience: beginner
      Depth: comprehensive
   ```

2. **Step-by-Step Progress**
   ```
   🔄 Step Results:
      ✅ Step 1: Course Plan Generation (Duration: 2341ms)
      ✅ Step 2: Keyword Cloud Generation (Duration: 1876ms)
      ✅ Step 3: Video Search (Duration: 3254ms)
      ✅ Step 4: Video Verification (Duration: 1432ms)
      ✅ Step 5: Artifact Generation (Duration: 4123ms)
      ✅ Step 6: Artifact Prioritization (Duration: 987ms)
      ✅ Step 7: Course Plan Refinement (Duration: 2198ms)
      ⏭️ Step 8: Course Save (SKIPPED)
   ```

3. **Final Course Structure**
   ```
   📚 Final Course Structure:
      Title: Course: Machine Learning from scratch
      Total Duration: 120 minutes
      Video Coverage: 83.3%
      Quality Score: 78.5%
      Lessons: 6
         1. Introduction to Machine Learning (20min)
            Primary: text, Supplementary: 2, Total: 3
   ```

4. **Artifact Analytics**
   ```
   📋 Artifact Summary:
      Generation: 18 artifacts, 6 lessons enhanced
      Quality: 76.2%
      By Type: text(6), exercise(4), quiz(3), summary(3), checklist(2)
   ```

### File Outputs

The test creates several output files:

#### 1. Test Results JSON
`logs/test-results/[timestamp]-v3-engine-test-results.json`

Complete API response data, configuration, and metrics.

#### 2. Test Summary Text
`logs/test-results/[timestamp]-v3-engine-test-results-summary.txt`

Human-readable summary with:
- Configuration details
- Step-by-step results
- Course structure breakdown
- Artifact analysis
- Performance metrics

#### 3. LLM API Logs
Individual API calls logged in:
- `logs/llm/orchestrator_v3/` - Main orchestrator calls
- `logs/llm/keyword_generation/` - Keyword generation
- `logs/llm/video_search/` - Video search results
- `logs/llm/artifact_generation/` - Artifact creation
- `logs/llm/artifact_prioritization/` - Artifact selection
- `logs/llm/course_plan_refinement/` - Course refinement

Each API type gets both JSON metadata and readable text files.

## Understanding the Results

### Success Indicators

✅ **All Steps Complete**: All 8 steps execute successfully
✅ **Artifacts Generated**: Non-zero artifacts created
✅ **Quality Scores**: Average quality > 0.5
✅ **Course Structure**: Complete lesson breakdown with artifacts
✅ **Performance**: Reasonable execution times

### Key Metrics to Check

1. **Step Success Rate**: All steps should succeed
2. **Artifact Coverage**: Each lesson should have 1 primary + 2-3 supplementary
3. **Quality Distribution**: Most artifacts should be medium-high quality
4. **Video Integration**: High video coverage percentage
5. **Execution Time**: Total time should be reasonable (< 60 seconds)

### Common Issues and Solutions

#### ❌ Step 1 Fails (Course Plan Generation)
- **Cause**: OpenAI API key issues or prompt problems
- **Solution**: Check API key, verify internet connection

#### ❌ Step 3 Fails (Video Search) 
- **Cause**: Keyword generation failed or API timeout
- **Solution**: Check previous steps, verify API limits

#### ❌ Step 5 Fails (Artifact Generation)
- **Cause**: Content generation issues or token limits
- **Solution**: Reduce lesson count or artifact types

#### ❌ Network Errors
- **Cause**: Development server not running or wrong port
- **Solution**: Ensure `npm run dev` is running on port 5173

## Next Steps After Testing

### If Test Passes ✅

1. **Review Generated Content**
   - Check artifact quality in the logs
   - Verify course structure makes sense
   - Ensure video integration is appropriate

2. **Test with Database Save**
   ```javascript
   // Modify test to enable database save
   skip_steps: [] // Remove 'course_save'
   auto_save: true
   ```

3. **Try Different Configurations**
   - Different audiences (intermediate, advanced)
   - Different depths (overview, deep-dive)
   - Different artifact strategies (comprehensive, minimal)

4. **Production Testing**
   - Test with actual user authentication
   - Test with real course topics
   - Monitor performance and costs

### If Test Fails ❌

1. **Check Error Messages**
   - Review console output for specific errors
   - Check step results for failure points
   - Examine error logs in test results files

2. **Verify Prerequisites**
   - Development server running
   - API keys configured
   - Network connectivity

3. **Debug Individual Steps**
   - Use existing engine API tests
   - Test individual v3 endpoints
   - Check LLM logs for API issues

4. **Report Issues**
   - Include test results files
   - Note specific error messages
   - Share configuration used

## Configuration Options

You can modify the test by editing `test-v3-engine-complete.js`:

```javascript
const requestBody = {
    // Change course topic
    user_prompt: 'Create a course about [YOUR TOPIC]',
    
    // Adjust audience
    audience: 'beginner|intermediate|advanced',
    
    // Modify lesson count
    lesson_count: 4, // or 6, 8, 10
    
    // Change strategies
    artifact_generation_strategy: 'comprehensive|targeted|minimal',
    
    // Enable/disable features
    skip_steps: ['course_save'], // Remove to enable DB save
    step_by_step: true, // Detailed logging
}
```

## Monitoring and Analytics

The test provides comprehensive analytics:

- **Performance**: Execution time per step and total
- **Quality**: Artifact quality scores and distribution
- **Coverage**: Video and artifact coverage per lesson
- **Success Rate**: Step completion and failure analysis
- **Content**: Generated course structure and materials

Use these metrics to:
- Optimize engine performance
- Improve content quality
- Monitor API costs
- Validate algorithm effectiveness

---

**📝 Note**: This test runs in "safe mode" by default (skips database save). Enable database operations only after verifying the engine works correctly.