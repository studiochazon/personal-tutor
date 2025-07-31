#!/usr/bin/env node

/**
 * Generate a valid JWT token for testing the keyword extraction API
 * ES module version for the client directory
 */

import jwt from 'jsonwebtoken';

// Same secret as used in the API (from auth files)
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

function generateTestToken(userId = 1, email = 'test@example.com') {
    const payload = {
        userId: userId,
        email: email,
        googleId: 'test-google-id-123'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return token;
}

function verifyTestToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

// Command line usage
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log('JWT Test Token Generator\n');
    console.log('Usage:');
    console.log('  node generate-test-token.mjs                    # Generate default token');
    console.log('  node generate-test-token.mjs --user-id=123      # Custom user ID');
    console.log('  node generate-test-token.mjs --email=test@x.com # Custom email');
    console.log('  node generate-test-token.mjs --verify TOKEN     # Verify a token\n');
    process.exit(0);
}

if (args[0] === '--verify') {
    if (!args[1]) {
        console.error('❌ Please provide a token to verify');
        process.exit(1);
    }
    
    const decoded = verifyTestToken(args[1]);
    if (decoded) {
        console.log('✅ Token is valid:');
        console.log('   User ID:', decoded.userId);
        console.log('   Email:', decoded.email);
        console.log('   Google ID:', decoded.googleId);
        console.log('   Expires:', new Date(decoded.exp * 1000).toISOString());
    } else {
        console.log('❌ Token is invalid');
        process.exit(1);
    }
    process.exit(0);
}

// Parse custom arguments
let userId = 1;
let email = 'test@example.com';

args.forEach(arg => {
    if (arg.startsWith('--user-id=')) {
        userId = parseInt(arg.split('=')[1]);
    }
    if (arg.startsWith('--email=')) {
        email = arg.split('=')[1];
    }
});

const token = generateTestToken(userId, email);

console.log('🔑 Generated JWT Test Token:');
console.log('='.repeat(50));
console.log(`User ID: ${userId}`);
console.log(`Email: ${email}`);
console.log('Token:');
console.log(token);
console.log();
console.log('💡 Copy this token for testing:');
console.log(`export JWT_TOKEN="${token}"`);
console.log();
console.log('🔍 To verify this token:');
console.log(`node generate-test-token.mjs --verify "${token}"`);

export { generateTestToken, verifyTestToken };