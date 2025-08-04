#!/usr/bin/env node

/**
 * Quick test for artifact prioritization API
 */

const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5173';
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

const testUser = {
    userId: 1,
    email: 'test@example.com'
};

const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
};

async function testArtifactPrioritization() {
    console.log('🎯 Testing Artifact Prioritization API...');
    
    const requestBody = {
        lessons_with_artifacts: [
            {
                lesson_index: 1,
                lesson_title: "Introduction to Machine Learning",
                lesson_topic: "ML Basics",
                lesson_duration: 20,
                needs_primary_artifact: true,
                artifacts: [
                    {
                        type: 'text',
                        title: 'Introduction to ML',
                        content: 'Sample text content...',
                        content_url: '',
                        metadata: {
                            estimated_time: 10,
                            difficulty: 'easy',
                            learning_objective: 'Understand ML basics'
                        },
                        quality_score: 0.8,
                        suitability_score: 0.9
                    },
                    {
                        type: 'video',
                        title: 'ML Video',
                        content: '',
                        content_url: 'https://youtube.com/watch?v=test',
                        metadata: {
                            estimated_time: 10,
                            difficulty: 'medium',
                            learning_objective: 'Visual learning',
                            video_duration: 600,
                            platform: 'youtube'
                        },
                        quality_score: 0.7,
                        suitability_score: 0.8
                    }
                ],
                has_video: true
            }
        ],
        prioritization_strategy: 'balanced',
        max_supplementary: 3,
        course_context: {
            audience: 'beginner',
            depth: 'comprehensive',
            total_duration: 120
        },
        quality_threshold: 0.5
    };

    try {
        console.log('📊 Request data:');
        console.log(`   Lessons: ${requestBody.lessons_with_artifacts.length}`);
        console.log(`   Strategy: ${requestBody.prioritization_strategy}`);
        console.log(`   Artifacts per lesson: ${requestBody.lessons_with_artifacts[0].artifacts.length}`);
        
        const response = await fetch(`${BASE_URL}/api/engine/v3/artifact_prioritization`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Artifact Prioritization API: SUCCESS');
            console.log(`   Lessons processed: ${data.prioritization_summary.lessons_processed}`);
            console.log(`   Primary artifacts: ${data.prioritization_summary.artifacts_by_role.primary}`);
            console.log(`   Supplementary artifacts: ${data.prioritization_summary.artifacts_by_role.supplementary}`);
            console.log(`   First lesson artifacts: ${data.prioritized_lessons[0].total_artifacts}`);
            return data;
        } else {
            console.log('❌ Artifact Prioritization API: FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            if (data.details) {
                console.log(`   Details: ${JSON.stringify(data.details, null, 2)}`);
            }
            return null;
        }
    } catch (error) {
        console.log('❌ Artifact Prioritization API: ERROR');
        console.log(`   ${error.message}`);
        return null;
    }
}

if (require.main === module) {
    testArtifactPrioritization().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testArtifactPrioritization };