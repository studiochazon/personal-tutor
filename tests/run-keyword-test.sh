#!/bin/bash

# Keyword Extraction API Test Runner
# This script helps you test the keyword extraction API easily

echo "🧪 Keyword Extraction API Test Runner"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "../client/package.json" ]; then
    echo "❌ Please run this script from the tests/ directory in the project root"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js Version: $NODE_VERSION"

# Extract major version number
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "⚠️  Warning: Node.js 18+ recommended for built-in fetch support"
    echo "   Your version: $NODE_VERSION"
    echo "   Installing node-fetch as fallback..."
    
    # Try to install node-fetch
    cd ../client
    npm install node-fetch --save-dev
    cd ../tests
fi

# Check if server is running
echo ""
echo "🔍 Checking if server is running..."

if curl -s -f "http://localhost:5173" > /dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:5173"
else
    echo "❌ Server is not running"
    echo ""
    echo "To start the server:"
    echo "   cd client"
    echo "   npm run dev"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set up environment variables if not already set
if [ -z "$JWT_TOKEN" ]; then
    echo ""
    echo "🔑 Generating JWT Token for testing..."
    
    # Check if we can generate a token
    if [ -f "../client/generate-test-token.mjs" ]; then
        # Generate a valid JWT token
        cd ../client
        TOKEN_OUTPUT=$(node generate-test-token.mjs 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            # Extract the token from the output
            export JWT_TOKEN=$(echo "$TOKEN_OUTPUT" | grep "^eyJ" | head -1)
            echo "   ✅ Generated valid JWT token"
        else
            echo "   ⚠️  Failed to generate token, using test token"
            export JWT_TOKEN="test-jwt-token-for-keyword-extraction"
        fi
        
        cd ../tests
    else
        echo "   ⚠️  Token generator not found, using test token"
        export JWT_TOKEN="test-jwt-token-for-keyword-extraction"
    fi
fi

if [ -z "$API_URL" ]; then
    export API_URL="http://localhost:5173"
fi

echo ""
echo "🚀 Test Configuration:"
echo "   API URL: $API_URL"
echo "   JWT Token: ${JWT_TOKEN:0:20}..."

echo ""
echo "🧪 Running Simple Test..."
echo "========================"

# Run the simple test
node test-keyword-simple.js

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Simple test completed successfully!"
    echo ""
    echo "🔬 Run Advanced Test? (includes quality assessment)"
    read -p "Run advanced test? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🧪 Running Advanced Test..."
        echo "=========================="
        node test-keyword-extraction-api.js
        ADVANCED_EXIT_CODE=$?
        
        if [ $ADVANCED_EXIT_CODE -eq 0 ]; then
            echo "🎉 All tests passed!"
        else
            echo "❌ Advanced test failed"
        fi
    fi
else
    echo "❌ Simple test failed"
    echo ""
    echo "💡 Troubleshooting Tips:"
    echo "   1. Make sure the server is running: cd client && npm run dev"
    echo "   2. Check if OpenAI API key is set in client/.env"
    echo "   3. Verify the API endpoint is accessible"
    echo "   4. Check server logs for errors"
fi

echo ""
echo "📖 For more help, run: node test-keyword-simple.js --help"