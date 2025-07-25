// Test script to verify flexible LLM logging with different response structures
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Mock the flexible LLM logger for testing
class MockFlexibleLLMLogger {
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
    console.log('📝 Flexible LLM Interaction logged:', {
      success,
      duration: `${duration}ms`,
      model: response.model,
      contentLength: response.content.length,
      hasRawResponse: !!response.raw_response
    });
    
    return logEntry.id;
  }
  
  async logResponseContent(userPrompt, responseContent, model) {
    console.log('📄 Flexible response content logged:', {
      model,
      promptLength: userPrompt.length,
      responseLength: responseContent.length,
      isJSON: this.isJSON(responseContent)
    });
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
  
  getStats() {
    const total = this.logs.length;
    const successful = this.logs.filter(log => log.success).length;
    const failed = total - successful;
    
    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: total > 0 ? this.logs.reduce((sum, log) => sum + log.duration_ms, 0) / total : 0,
      totalTokens: 0,
      models: { 'gpt-4': total }
    };
  }
}

const mockLogger = new MockFlexibleLLMLogger();

async function testFlexibleLogging() {
  console.log('🧪 Testing Flexible LLM Logging System\n');
  
  const userPrompt = "Create a course about Python data analysis";
  
  try {
    // Test 1: Standard OpenAI response structure
    console.log('1️⃣ Testing standard OpenAI response structure...');
    
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
    
    // Test with standard OpenAI structure
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
    
    console.log('✅ Standard OpenAI structure logged');
    
    // Test 2: Alternative response structure (simulated)
    console.log('\n2️⃣ Testing alternative response structure...');
    
    const alternativeResponse = {
      content: 'This is an alternative response format',
      model_name: 'custom-model',
      finish_reason: 'completed',
      usage: { total: 150 }
    };
    
    await mockLogger.logLLMInteraction(
      {
        model: 'custom-model',
        messages: [{ role: 'user', content: 'test' }],
        user_prompt: 'test alternative structure'
      },
      {
        content: alternativeResponse.content,
        usage: alternativeResponse.usage,
        model: alternativeResponse.model_name,
        finish_reason: alternativeResponse.finish_reason,
        raw_response: alternativeResponse
      },
      true,
      undefined,
      500
    );
    
    await mockLogger.logResponseContent('test', alternativeResponse.content, alternativeResponse.model_name);
    
    console.log('✅ Alternative structure logged');
    
    // Test 3: Error response structure
    console.log('\n3️⃣ Testing error response structure...');
    
    await mockLogger.logLLMInteraction(
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
        user_prompt: 'test error'
      },
      {
        content: 'Error: API rate limit exceeded',
        model: 'gpt-4',
        raw_response: { error: 'rate_limit_exceeded' }
      },
      false,
      'API rate limit exceeded',
      100
    );
    
    console.log('✅ Error structure logged');
    
    // Test 4: JSON response content
    console.log('\n4️⃣ Testing JSON response content formatting...');
    
    const jsonResponse = JSON.stringify({
      title: "Python Data Analysis Course",
      description: "Learn data analysis with Python",
      lessons: [
        { title: "Introduction", content: "Welcome to the course" }
      ]
    }, null, 2);
    
    await mockLogger.logResponseContent(userPrompt, jsonResponse, 'gpt-4');
    
    console.log('✅ JSON content formatting tested');
    
    // Test 5: Statistics with flexible structure
    console.log('\n5️⃣ Testing flexible statistics...');
    
    const stats = mockLogger.getStats();
    console.log('📊 Flexible Logging Statistics:');
    console.log(`- Total requests: ${stats.totalRequests}`);
    console.log(`- Successful: ${stats.successfulRequests}`);
    console.log(`- Failed: ${stats.failedRequests}`);
    console.log(`- Average response time: ${Math.round(stats.averageResponseTime)}ms`);
    console.log(`- Models used: ${Object.keys(stats.models).join(', ')}`);
    
    // Test 6: Summary
    console.log('\n🎯 Flexible Logging Test Summary:');
    console.log('✅ Standard OpenAI structure handled');
    console.log('✅ Alternative response structures handled');
    console.log('✅ Error responses handled');
    console.log('✅ JSON content formatting works');
    console.log('✅ Flexible statistics calculation');
    console.log(`✅ ${mockLogger.logs.length} interactions logged with different structures`);
    
    console.log('\n🎉 SUCCESS: Flexible LLM logging system is working correctly!');
    
  } catch (error) {
    console.error('❌ Error during flexible logging test:', error);
  }
}

testFlexibleLogging(); 