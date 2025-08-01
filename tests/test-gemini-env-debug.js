#!/usr/bin/env node

/**
 * Debug script to test Gemini environment and API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file manually
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf8');

console.log('🔍 Environment Variables from .env:');
console.log('=====================================');

envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key?.includes('GEMINI')) {
            console.log(`${key}: ${value ? '✅ Set' : '❌ Not Set'}`);
        }
    }
});

// Test Gemini API directly
async function testGeminiAPI() {
    const geminiKey = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();
    
    if (!geminiKey) {
        console.log('❌ GEMINI_API_KEY not found in .env file');
        return false;
    }
    
    console.log('\n🧪 Testing Gemini API directly...');
    
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Return only the text: "Gemini API working"' }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 50
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Gemini API Error: ${response.status} - ${errorText}`);
            return false;
        }
        
        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        console.log(`✅ Gemini API Response: ${content}`);
        console.log(`📊 Usage: ${JSON.stringify(result.usageMetadata, null, 2)}`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ Gemini API Test Failed: ${error.message}`);
        return false;
    }
}

console.log('\n🚀 Running Gemini Environment Debug Test...');
testGeminiAPI().then(success => {
    if (success) {
        console.log('\n✅ Gemini API is working! The issue might be with server environment loading.');
        console.log('💡 Try restarting your development server to pick up the latest changes.');
    } else {
        console.log('\n❌ Gemini API test failed. Check your API key and network connection.');
    }
}).catch(error => {
    console.error('💥 Test failed:', error);
});