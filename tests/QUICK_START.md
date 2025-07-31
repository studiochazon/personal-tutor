# 🚀 Quick Start - Keyword Extraction API Tests

## ✅ Ready to Use Tests

Your keyword extraction API tests are now fully working! Here's how to use them:

### 🎯 **Option 1: Simple Test (Recommended)**

```bash
cd tests
node test-keyword-simple.js
```

**What it does:**
- Tests the `PATCH /api/engine/v3/keyword_generation` API
- Uses your creationism course plan as test data
- Extracts ~45 keywords in 5 categories
- Takes about 15-20 seconds to complete

**Expected Output:**
```
✅ Response received (15307ms)
   Status: 200 OK

📊 Keyword Extraction Results:
🎯 Primary Keywords (8): Creationism, Historical Development...
🔍 Secondary Keywords (10): Religious Context, Cultural Context...
🎥 Video Search Terms (15): Creationism tutorial, Creationism explained...

📈 Summary:
   Total Keywords Generated: 45
   Test Status: ✅ PASSED
```

### 🔬 **Option 2: Advanced Test (Detailed Analysis)**

```bash
cd tests
node test-keyword-extraction-api.js
```

**What it adds:**
- Quality assessment scoring
- Performance metrics
- Detailed keyword analysis
- Improvement suggestions

### 🛠️ **Option 3: Automated Test Runner**

```bash
cd tests
./run-keyword-test.sh
```

**What it does:**
- Checks prerequisites automatically
- Generates JWT tokens if needed
- Runs tests with guidance
- Provides troubleshooting help

## 🔑 **Authentication Handled**

The tests now include a **valid JWT token** by default, so they work out of the box! No need to:
- Set up authentication manually
- Generate tokens yourself
- Configure environment variables

## 📊 **Sample Results from Your Creationism Course**

The API successfully extracts keywords like:

**Primary Keywords:**
- Creationism
- Historical Development of Creationism  
- Theological Underpinnings of Creationism
- Forms of Creationism
- Young Earth Creationism

**Video Search Terms:**
- Creationism tutorial
- Creationism explained
- Understanding Creationism course
- Historical Development of Creationism guide
- Types of Creationism explained

**Total:** ~45 keywords across 5 categories

## 🎉 **Using the Keywords**

After extraction, use the keywords for:

```javascript
// YouTube video search
keywords.video_search_terms.forEach(term => {
    searchYouTube(term);
});

// Academic content discovery  
keywords.long_tail_keywords.forEach(phrase => {
    searchAcademicDatabase(phrase);
});

// SEO and content planning
const allKeywords = [
    ...keywords.primary_keywords,
    ...keywords.secondary_keywords
];
```

## 🚨 **Prerequisites**

1. **Server running:** `cd client && npm run dev`
2. **OpenAI API key:** Set in `client/.env`
3. **Node.js 18+:** For built-in fetch support

## 💡 **Troubleshooting**

### "Connection refused"
```bash
cd client && npm run dev
```

### "OpenAI API error"  
Check `client/.env` has:
```env
OPENAI_API_KEY=your-key-here
```

### "No fetch implementation"
Use Node.js 18+ or install:
```bash
npm install node-fetch
```

## 🎯 **What's Different from Before**

✅ **Fixed:** Authentication now works with valid JWT tokens  
✅ **Fixed:** Tests work out of the box with default configuration  
✅ **Added:** Automatic token generation in test runner  
✅ **Added:** Comprehensive error handling and troubleshooting  

## 🔄 **Next Steps**

1. **Test the API:** Run `node test-keyword-simple.js`
2. **Use with your course plans:** Replace test data with your own course text
3. **Integrate with video search:** Use the generated keywords for content discovery
4. **Scale up:** Use the orchestrator API for full course creation workflow

Your keyword extraction API is ready for production use! 🎉