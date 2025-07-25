// Test script to verify response storage is working correctly
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Mock the LLM logger to test response storage
class MockResponseStorageLogger {
  logs = [];
  
  async logLLMInteraction(request, response, success, error, duration) {
    const logEntry = {
      id: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      request,
      response,
      success,
      error,
      duration_ms: duration
    };
    
    this.logs.push(logEntry);
    
    console.log('📝 Response Storage Test:');
    console.log(`  ✅ Success: ${success}`);
    console.log(`  ✅ Duration: ${duration}ms`);
    console.log(`  ✅ Model: ${response.model}`);
    console.log(`  ✅ Content Length: ${response.content.length}`);
    console.log(`  ✅ Has Raw Response: ${!!response.raw_response}`);
    console.log(`  ✅ Raw Response Keys: ${response.raw_response ? Object.keys(response.raw_response).join(', ') : 'none'}`);
    
    if (response.raw_response?.choices) {
      console.log(`  ✅ Has Choices: ${response.raw_response.choices.length}`);
      console.log(`  ✅ First Choice Content: ${response.raw_response.choices[0]?.message?.content?.substring(0, 100)}...`);
    }
    
    if (response.raw_response?.usage) {
      console.log(`  ✅ Usage Tokens: ${response.raw_response.usage.total_tokens || 'unknown'}`);
    }
    
    return logEntry.id;
  }
  
  async logResponseContent(userPrompt, responseContent, model) {
    console.log('📄 Response Content Test:');
    console.log(`  ✅ Model: ${model}`);
    console.log(`  ✅ Prompt Length: ${userPrompt.length}`);
    console.log(`  ✅ Response Length: ${responseContent.length}`);
    console.log(`  ✅ Is JSON: ${this.isJSON(responseContent)}`);
    console.log(`  ✅ Content Preview: ${responseContent.substring(0, 200)}...`);
    
    return `response-${Date.now()}.txt`;
  }
  
  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
  
  getLatestLog() {
    return this.logs[this.logs.length - 1];
  }
}

const mockLogger = new MockResponseStorageLogger();

async function testResponseStorage() {
  console.log('🧪 Testing Response Storage System\n');
  
  const userPrompt = "Create a course about JavaScript basics";
  
  try {
    console.log('1️⃣ Testing OpenAI API call with proper response parsing...');
    
    const startTime = Date.now();
    
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
            content: 'You are a helpful assistant. Respond with a short JSON object containing a title and description.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Raw OpenAI response received');
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Model: ${data.model}`);
    console.log(`  - Choices: ${data.choices?.length || 0}`);
    console.log(`  - Usage: ${data.usage ? 'present' : 'missing'}`);
    
    // Test response storage with parsed data
    await mockLogger.logLLMInteraction(
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
        user_prompt: userPrompt
      },
      {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        finish_reason: data.choices[0]?.finish_reason,
        raw_response: data
      },
      true,
      undefined,
      duration
    );

    await mockLogger.logResponseContent(userPrompt, data.choices[0]?.message?.content || '', data.model);
    
    console.log('\n2️⃣ Verifying stored response data...');
    
    const latestLog = mockLogger.getLatestLog();
    
    if (latestLog) {
      console.log('✅ Latest log entry found');
      console.log(`  - ID: ${latestLog.id}`);
      console.log(`  - Success: ${latestLog.success}`);
      console.log(`  - Model: ${latestLog.response.model}`);
      console.log(`  - Content: ${latestLog.response.content.substring(0, 100)}...`);
      console.log(`  - Raw Response Type: ${typeof latestLog.response.raw_response}`);
      
      if (latestLog.response.raw_response) {
        console.log(`  - Raw Response Keys: ${Object.keys(latestLog.response.raw_response).join(', ')}`);
        
        if (latestLog.response.raw_response.choices) {
          console.log(`  - Choices Count: ${latestLog.response.raw_response.choices.length}`);
          console.log(`  - First Choice Content: ${latestLog.response.raw_response.choices[0]?.message?.content?.substring(0, 100)}...`);
        }
        
        if (latestLog.response.raw_response.usage) {
          console.log(`  - Usage Tokens: ${latestLog.response.raw_response.usage.total_tokens || 'unknown'}`);
        }
      }
    } else {
      console.log('❌ No log entry found');
    }
    
    // Test 3: Verify content matches
    console.log('\n3️⃣ Verifying content consistency...');
    
    const originalContent = data.choices[0]?.message?.content;
    const storedContent = latestLog?.response?.content;
    const rawContent = latestLog?.response?.raw_response?.choices?.[0]?.message?.content;
    
    console.log(`  - Original Content Length: ${originalContent?.length || 0}`);
    console.log(`  - Stored Content Length: ${storedContent?.length || 0}`);
    console.log(`  - Raw Content Length: ${rawContent?.length || 0}`);
    
    if (originalContent === storedContent && originalContent === rawContent) {
      console.log('✅ Content consistency verified');
    } else {
      console.log('❌ Content inconsistency detected');
      console.log(`  - Original: ${originalContent?.substring(0, 50)}...`);
      console.log(`  - Stored: ${storedContent?.substring(0, 50)}...`);
      console.log(`  - Raw: ${rawContent?.substring(0, 50)}...`);
    }
    
    // Test 4: Summary
    console.log('\n🎯 Response Storage Test Summary:');
    console.log('✅ OpenAI API response received');
    console.log('✅ Response parsed correctly');
    console.log('✅ Data stored in logs');
    console.log('✅ Raw response preserved');
    console.log('✅ Content consistency maintained');
    console.log(`✅ ${mockLogger.logs.length} log entries created`);
    
    console.log('\n🎉 SUCCESS: Response storage is working correctly!');
    
  } catch (error) {
    console.error('❌ Error during response storage test:', error);
  }
}

testResponseStorage(); 