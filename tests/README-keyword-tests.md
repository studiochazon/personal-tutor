# Keyword Extraction API Tests

This directory contains tests for the keyword extraction API that extracts keywords from course plan text.

## Overview

The keyword extraction API (`PATCH /api/engine/v3/keyword_generation`) takes raw course plan text and generates categorized keywords for finding educational content online.

## Test Files

### 1. `test-keyword-simple.js`
- **Purpose**: Basic functionality test
- **Requirements**: Node.js (18+ preferred)
- **Runtime**: ~5-10 seconds
- **Usage**: Quick verification that the API is working

### 2. `test-keyword-extraction-api.js`
- **Purpose**: Comprehensive test with quality assessment
- **Requirements**: Node.js (18+ preferred)
- **Runtime**: ~10-20 seconds
- **Usage**: Detailed analysis of keyword quality and coverage

### 3. `run-keyword-test.sh`
- **Purpose**: Test runner script with environment setup
- **Requirements**: Bash shell, Node.js
- **Usage**: Automated test execution with guidance

## Quick Start

### Option 1: Use the Test Runner (Recommended)
```bash
cd tests
./run-keyword-test.sh
```

### Option 2: Run Tests Directly
```bash
# Simple test
cd tests
node test-keyword-simple.js

# Advanced test
node test-keyword-extraction-api.js
```

### Option 3: Run with Custom Configuration
```bash
# Set environment variables
export API_URL="http://localhost:5173"
export JWT_TOKEN="your-jwt-token-here"

# Run test
cd tests
node test-keyword-simple.js
```

## Prerequisites

### 1. Server Setup
The API server must be running:
```bash
cd client
npm run dev
```

### 2. Environment Configuration
Make sure these are configured in `client/.env`:
```env
OPENAI_API_KEY=your-openai-api-key
```

### 3. Authentication
You need a valid JWT token. For testing, you can:
- Use the test token (server should accept it for development)
- Get a real token from the auth endpoint
- Set `JWT_TOKEN` environment variable

## Test Data

The tests use sample course plan text about creationism to verify:
- Keyword extraction accuracy
- Response time performance
- API response structure
- Error handling

## Expected Results

A successful test should generate:
- **Primary Keywords** (5-8): Core concepts like "creationism", "intelligent design"
- **Secondary Keywords** (10-15): Supporting terms like "young earth", "biblical interpretation"
- **Long-tail Keywords** (15-20): Phrases like "introduction to creationism", "types of creationism"
- **Video Search Terms** (20-30): Video-optimized terms like "creationism explained", "creationism tutorial"
- **Excluded Terms** (5-10): Terms to avoid in searches

## Troubleshooting

### Common Issues

1. **"No fetch implementation found"**
   - Use Node.js 18+ or install node-fetch: `npm install node-fetch`

2. **"Connection refused"**
   - Make sure server is running: `cd client && npm run dev`

3. **"Authentication required"**
   - Set valid JWT token: `export JWT_TOKEN="your-token"`

4. **"OpenAI API error"**
   - Check API key in `client/.env`
   - Verify OpenAI account has credits

5. **"Course plan file not found"**
   - Make sure you're running from the tests directory
   - Verify the course plan file exists: `client/llm-logs/simple-response/1-creationism.txt`

### Getting Help

```bash
# Show test help
node test-keyword-simple.js --help
node test-keyword-extraction-api.js --help

# Check server status
curl http://localhost:5173/api/test

# Verify JWT token format
echo $JWT_TOKEN | cut -d'.' -f1 | base64 -d
```

## Test Output Examples

### Successful Test
```
🧪 Simple Keyword Extraction API Test

📋 Test Configuration:
   API URL: http://localhost:5173
   JWT Token: test-jwt-token-for...
   Test Data Length: 892 characters

🚀 Making API request...
✅ Response received (1247ms)
   Status: 200 OK

📊 Keyword Extraction Results:
========================================

🎯 Primary Keywords (6):
   1. creationism
   2. intelligent design
   3. young earth creationism
   4. theological foundations
   5. historical development
   ... and 1 more

🔍 Secondary Keywords (12):
   1. old earth creationism
   2. gap creationism
   3. scriptural interpretation
   4. religious contexts
   5. educational implications
   ... and 7 more

🎥 Video Search Terms (23):
   1. creationism explained
   2. creationism tutorial
   3. types of creationism
   4. creationism history
   5. biblical creation
   ... and 18 more

📈 Summary:
   Total Keywords Generated: 47
   API Response Time: 1247ms
   Test Status: ✅ PASSED

🎉 Test completed successfully!
```

## Integration with Other Systems

The generated keywords can be used for:

1. **YouTube Video Search**
   ```javascript
   keywords.video_search_terms.forEach(term => {
       searchYouTube(term);
   });
   ```

2. **Academic Content Discovery**
   ```javascript
   keywords.long_tail_keywords.forEach(phrase => {
       searchAcademicDB(phrase);
   });
   ```

3. **SEO and Content Planning**
   ```javascript
   const allKeywords = [
       ...keywords.primary_keywords,
       ...keywords.secondary_keywords
   ];
   ```

## Performance Expectations

- **Response Time**: 1-5 seconds (depends on OpenAI API)
- **Keyword Count**: 40-60 total keywords
- **Success Rate**: >95% for valid course plans
- **Memory Usage**: Minimal (<50MB)

## Contributing

When adding new tests:
1. Follow the naming convention: `test-keyword-*.js`
2. Include error handling and helpful output
3. Add documentation to this README
4. Test with both valid and invalid inputs