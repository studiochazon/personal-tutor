#!/usr/bin/env node

/**
 * Environment Check Script for V3 Engine Testing
 * Validates that the environment is ready for v3 engine testing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5173';
const REQUIRED_ENV_VARS = ['OPENAI_API_KEY'];

/**
 * Check if development server is running
 */
async function checkDevServer() {
    console.log('🌐 Checking development server...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/test`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Development server is running');
            console.log(`   URL: ${BASE_URL}`);
            console.log(`   Status: ${data.message}`);
            return true;
        } else {
            console.log('❌ Development server responded with error');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(data)}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Development server is not running or unreachable');
        console.log(`   Error: ${error.message}`);
        console.log(`   Expected URL: ${BASE_URL}`);
        console.log('\n💡 To start the development server:');
        console.log('   npm run dev');
        return false;
    }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
    console.log('\n🔑 Checking environment variables...');
    
    const missingVars = [];
    const setVars = [];
    
    REQUIRED_ENV_VARS.forEach(varName => {
        if (process.env[varName]) {
            setVars.push(varName);
            console.log(`✅ ${varName}: Set`);
        } else {
            missingVars.push(varName);
            console.log(`❌ ${varName}: Not set`);
        }
    });
    
    if (missingVars.length > 0) {
        console.log('\n💡 Missing environment variables:');
        missingVars.forEach(varName => {
            console.log(`   ${varName}`);
        });
        console.log('\n   Add them to your .env file or export them:');
        missingVars.forEach(varName => {
            console.log(`   export ${varName}=your_value_here`);
        });
        return false;
    }
    
    console.log('✅ All required environment variables are set');
    return true;
}

/**
 * Check log directories
 */
function checkLogDirectories() {
    console.log('\n📂 Checking log directories...');
    
    const logDirs = [
        'logs',
        'logs/llm',
        'logs/test-results'
    ];
    
    let allExist = true;
    
    logDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`✅ ${dir}: Exists`);
        } else {
            console.log(`⚠️  ${dir}: Will be created`);
            try {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`   Created: ${dir}`);
            } catch (error) {
                console.log(`❌ Failed to create ${dir}: ${error.message}`);
                allExist = false;
            }
        }
    });
    
    return allExist;
}

/**
 * Check database connection (optional)
 */
async function checkDatabaseConnection() {
    console.log('\n🗄️  Checking database connection (optional)...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/test-db`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Database connection is working');
            console.log(`   Users in database: ${data.userCount}`);
            return true;
        } else {
            console.log('⚠️  Database connection issues (not required for v3 test)');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('⚠️  Database connection failed (not required for v3 test)');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Test basic API authentication
 */
async function checkApiAuthentication() {
    console.log('\n🔐 Testing API authentication...');
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
    
    const testUser = {
        userId: 1,
        email: 'test@example.com'
    };
    
    const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    
    try {
        const response = await fetch(`${BASE_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${testToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ API authentication is working');
            console.log(`   Test user: ${data.user.email}`);
            return true;
        } else {
            console.log('❌ API authentication failed');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ API authentication test failed');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Test a simple LLM request
 */
async function checkLLMConnection() {
    console.log('\n🤖 Testing LLM connection...');
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
    
    const testUser = {
        userId: 1,
        email: 'test@example.com'
    };
    
    const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    
    const requestBody = {
        model: 'gpt-4',
        messages: [
            {
                role: 'user',
                content: 'Say "Hello from V3 Engine test environment" and nothing else.'
            }
        ],
        context: 'Environment Test',
        max_tokens: 20,
        temperature: 0
    };
    
    try {
        const response = await fetch(`${BASE_URL}/api/engine/llm_request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ LLM connection is working');
            console.log(`   Model: ${data.model}`);
            console.log(`   Response: ${data.response.substring(0, 50)}...`);
            return true;
        } else {
            console.log('❌ LLM connection failed');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log('❌ LLM connection test failed');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

/**
 * Run all environment checks
 */
async function runEnvironmentChecks() {
    console.log('🔍 V3 Engine Test Environment Check');
    console.log('='.repeat(50));
    
    const checks = [
        { name: 'Development Server', fn: checkDevServer, required: true },
        { name: 'Environment Variables', fn: checkEnvironmentVariables, required: true },
        { name: 'Log Directories', fn: checkLogDirectories, required: true },
        { name: 'API Authentication', fn: checkApiAuthentication, required: true },
        { name: 'LLM Connection', fn: checkLLMConnection, required: true },
        { name: 'Database Connection', fn: checkDatabaseConnection, required: false }
    ];
    
    const results = [];
    
    for (const check of checks) {
        try {
            const result = await check.fn();
            results.push({ ...check, result, error: null });
        } catch (error) {
            results.push({ ...check, result: false, error: error.message });
            console.log(`❌ ${check.name} check failed: ${error.message}`);
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Environment Check Summary');
    console.log('='.repeat(50));
    
    const requiredPassed = results.filter(r => r.required && r.result).length;
    const requiredTotal = results.filter(r => r.required).length;
    const optionalPassed = results.filter(r => !r.required && r.result).length;
    const optionalTotal = results.filter(r => !r.required).length;
    
    console.log(`Required Checks: ${requiredPassed}/${requiredTotal} passed`);
    console.log(`Optional Checks: ${optionalPassed}/${optionalTotal} passed`);
    
    results.forEach(check => {
        const status = check.result ? '✅' : '❌';
        const type = check.required ? 'Required' : 'Optional';
        console.log(`  ${status} ${check.name} (${type})`);
        if (!check.result && check.error) {
            console.log(`      Error: ${check.error}`);
        }
    });
    
    const canRunTests = requiredPassed === requiredTotal;
    
    if (canRunTests) {
        console.log('\n🎉 Environment is ready for V3 Engine testing!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run the V3 engine test:');
        console.log('      node tests/test-v3-engine-complete.js');
        console.log('   2. Check the test guide:');
        console.log('      cat tests/V3_ENGINE_TEST_GUIDE.md');
        console.log('   3. Monitor logs in logs/llm/ and logs/test-results/');
    } else {
        console.log('\n❌ Environment is not ready for testing');
        console.log('\n🛠️  Please fix the failed required checks above');
        console.log('\n💡 Common fixes:');
        console.log('   - Start dev server: npm run dev');
        console.log('   - Set API key: export OPENAI_API_KEY=your_key');
        console.log('   - Check network connectivity');
    }
    
    return canRunTests;
}

// Run checks if called directly
if (require.main === module) {
    runEnvironmentChecks().catch(error => {
        console.error('💥 Environment check failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runEnvironmentChecks,
    checkDevServer,
    checkEnvironmentVariables,
    checkLogDirectories,
    checkDatabaseConnection,
    checkApiAuthentication,
    checkLLMConnection
};