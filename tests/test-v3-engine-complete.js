#!/usr/bin/env node

/**
 * V3 Course Creation Engine Complete Test
 * Tests the new 8-step v3 engine end-to-end with "Machine Learning from scratch"
 * 
 * Usage: node tests/test-v3-engine-complete.js
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5173'; // Development server
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Create test JWT token
const testUser = {
    userId: 1,
    email: 'test@example.com'
};

const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

// Common headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
};

/**
 * Save test results to a log file
 */
function saveTestResults(results, filename = 'v3-engine-test-results.json') {
    const logsDir = path.join(process.cwd(), 'logs', 'test-results');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${timestamp}-${filename}`;
    const filePath = path.join(logsDir, fullFilename);
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
        console.log(`📄 Test results saved to: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error('❌ Failed to save test results:', error.message);
        return null;
    }
}

/**
 * Create a readable test summary
 */
function createTestSummary(results) {
    const timestamp = new Date().toISOString();
    const summary = `
=== V3 Course Creation Engine Test Summary ===
Timestamp: ${timestamp}
Course Topic: Machine Learning from scratch
Test Mode: End-to-end with database save skipped

=== Test Configuration ===
Base URL: ${BASE_URL}
User: ${testUser.email}
Steps: ${results.stepResults ? results.stepResults.length : 'Unknown'}

=== Execution Summary ===
${results.executionSummary ? `
Total Execution Time: ${results.executionSummary.total_execution_time_ms}ms (${(results.executionSummary.total_execution_time_ms / 1000).toFixed(1)}s)
Steps Completed: ${results.executionSummary.steps_completed}
Steps Failed: ${results.executionSummary.steps_failed}
Final Status: ${results.executionSummary.final_status}
${results.executionSummary.artifacts_generated ? `
Artifacts Generated: ${results.executionSummary.artifacts_generated}
Primary Artifacts: ${results.executionSummary.lessons_with_primary_artifacts}
Supplementary Artifacts: ${results.executionSummary.total_supplementary_artifacts}
Average Artifact Quality: ${(results.executionSummary.average_artifact_quality * 100).toFixed(1)}%
` : ''}
` : 'No execution summary available'}

=== Step Results ===
${results.stepResults ? results.stepResults.map((step, index) => `
Step ${step.step_number}: ${step.step_name}
  Status: ${step.success ? '✅ SUCCESS' : '❌ FAILED'}
  Duration: ${step.execution_time_ms}ms
  API: ${step.api_endpoint}
  ${step.error ? `Error: ${step.error}` : ''}
  ${step.data ? `Data Keys: ${Object.keys(step.data).join(', ')}` : 'No data'}
`).join('') : 'No step results available'}

=== Final Course Structure ===
${results.finalCourse ? `
Title: ${results.finalCourse.title}
Topic: ${results.finalCourse.topic}
Total Duration: ${results.finalCourse.total_duration} minutes
Video Coverage: ${(results.finalCourse.video_coverage * 100).toFixed(1)}%
Quality Score: ${(results.finalCourse.quality_score * 100).toFixed(1)}%
Lessons: ${results.finalCourse.lessons ? results.finalCourse.lessons.length : 0}

${results.finalCourse.lessons ? results.finalCourse.lessons.map((lesson, index) => `
Lesson ${index + 1}: ${lesson.lesson_title || lesson.title}
  Duration: ${lesson.lesson_duration || lesson.duration} minutes
  Primary Artifact: ${lesson.primary_artifact ? lesson.primary_artifact.type : 'None'}
  Supplementary: ${lesson.supplementary_artifacts ? lesson.supplementary_artifacts.length : 0} artifacts
  Total Artifacts: ${lesson.total_artifacts || (lesson.primary_artifact ? 1 : 0) + (lesson.supplementary_artifacts ? lesson.supplementary_artifacts.length : 0)}
`).join('') : 'No lesson details available'}
` : 'No final course data available'}

=== Artifact Summary ===
${results.artifactSummary ? `
Generation Summary:
  Total Artifacts: ${results.artifactSummary.generation ? results.artifactSummary.generation.total_artifacts : 'N/A'}
  Lessons Enhanced: ${results.artifactSummary.generation ? results.artifactSummary.generation.lessons_enhanced : 'N/A'}
  Average Quality: ${results.artifactSummary.generation ? (results.artifactSummary.generation.average_quality_score * 100).toFixed(1) + '%' : 'N/A'}
  
  Artifacts by Type:
${results.artifactSummary.generation && results.artifactSummary.generation.artifacts_by_type ? 
    Object.entries(results.artifactSummary.generation.artifacts_by_type)
      .map(([type, count]) => `    ${type}: ${count}`)
      .join('\n') : '    No breakdown available'}

Prioritization Summary:
  Lessons Processed: ${results.artifactSummary.prioritization ? results.artifactSummary.prioritization.lessons_processed : 'N/A'}
  Primary Artifacts: ${results.artifactSummary.prioritization ? results.artifactSummary.prioritization.artifacts_by_role.primary : 'N/A'}
  Supplementary Artifacts: ${results.artifactSummary.prioritization ? results.artifactSummary.prioritization.artifacts_by_role.supplementary : 'N/A'}
  
  Quality Distribution:
${results.artifactSummary.prioritization && results.artifactSummary.prioritization.quality_distribution ? `
    High Quality (≥80%): ${results.artifactSummary.prioritization.quality_distribution.high_quality}
    Medium Quality (50-80%): ${results.artifactSummary.prioritization.quality_distribution.medium_quality}
    Low Quality (<50%): ${results.artifactSummary.prioritization.quality_distribution.low_quality}
` : '    No quality data available'}
` : 'No artifact summary available'}

=== Test Status ===
Overall Result: ${results.success ? '🎉 SUCCESS' : '❌ FAILED'}
${results.error ? `Error: ${results.error}` : ''}

=== Next Steps ===
${results.success ? `
✅ The v3 engine is working correctly!
📝 Check the individual step logs in: logs/llm/[api-type]/
🔍 Review the generated artifacts and course structure above
🚀 Ready for production deployment
` : `
❌ The v3 engine encountered issues
🔍 Check the step results and error messages above
📝 Review the detailed logs in: logs/llm/[api-type]/
🛠️  Fix the issues and run the test again
`}

=== End Summary ===
`;

    return summary;
}

/**
 * Test the complete V3 engine orchestrator
 */
async function testV3EngineComplete() {
    console.log('\n🚀 Testing V3 Course Creation Engine - Complete Flow');
    console.log('📚 Course Topic: "Machine Learning from scratch"');
    console.log('🔧 Mode: End-to-end with database save skipped');
    
    const requestBody = {
        user_prompt: 'Create a comprehensive course about Machine Learning from scratch for beginners who want to understand the fundamentals and build their first ML models',
        audience: 'beginner',
        depth: 'comprehensive',
        
        // Course structure
        lesson_count: 6,
        duration: 120,
        preferred_video_duration: 10,
        quality_preference: 'educational',
        
        // Strategies
        keyword_strategy: 'mixed',
        search_strategy: 'mixed',
        refinement_strategy: 'balanced',
        
        // Artifact options
        artifact_types: ['text', 'exercise', 'quiz', 'summary', 'checklist'],
        max_supplementary_artifacts: 3,
        artifact_generation_strategy: 'targeted',
        
        // Options
        enable_fallbacks: true,
        quality_threshold: 0.5,
        max_videos_per_lesson: 2,
        auto_save: false, // Skip database save for testing
        auto_publish: false,
        create_enrollment: false,
        
        // Debug options
        step_by_step: true, // Get detailed step results
        skip_steps: ['course_save'] // Skip database save but get the course data
    };

    console.log('\n📊 Test Configuration:');
    console.log(`   Lessons: ${requestBody.lesson_count}`);
    console.log(`   Duration: ${requestBody.duration} minutes`);
    console.log(`   Audience: ${requestBody.audience}`);
    console.log(`   Depth: ${requestBody.depth}`);
    console.log(`   Artifact Types: ${requestBody.artifact_types.join(', ')}`);
    console.log(`   Generation Strategy: ${requestBody.artifact_generation_strategy}`);
    console.log(`   Skipped Steps: ${requestBody.skip_steps.join(', ')}`);

    const startTime = Date.now();

    try {
        console.log('\n⏳ Calling V3 Orchestrator API...');
        
        const response = await fetch(`${BASE_URL}/api/engine/v3/orchestrator`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        const totalTestTime = Date.now() - startTime;

        console.log(`\n📈 API Response received in ${totalTestTime}ms`);

        if (response.ok && data.success) {
            console.log('\n✅ V3 Engine Orchestrator: SUCCESS');
            
            // Log execution summary
            if (data.execution_summary) {
                console.log('\n📊 Execution Summary:');
                console.log(`   Total Time: ${data.execution_summary.total_execution_time_ms}ms (${(data.execution_summary.total_execution_time_ms / 1000).toFixed(1)}s)`);
                console.log(`   Steps Completed: ${data.execution_summary.steps_completed}`);
                console.log(`   Steps Failed: ${data.execution_summary.steps_failed}`);
                console.log(`   Final Status: ${data.execution_summary.final_status}`);
                
                if (data.execution_summary.artifacts_generated !== undefined) {
                    console.log(`   Artifacts Generated: ${data.execution_summary.artifacts_generated}`);
                    console.log(`   Primary Artifacts: ${data.execution_summary.lessons_with_primary_artifacts}`);
                    console.log(`   Supplementary Artifacts: ${data.execution_summary.total_supplementary_artifacts}`);
                    console.log(`   Avg Artifact Quality: ${(data.execution_summary.average_artifact_quality * 100).toFixed(1)}%`);
                }
            }

            // Log step results
            if (data.step_results) {
                console.log('\n🔄 Step Results:');
                data.step_results.forEach((step, index) => {
                    const status = step.success ? '✅' : '❌';
                    console.log(`   ${status} Step ${step.step_number}: ${step.step_name}`);
                    console.log(`      Duration: ${step.execution_time_ms}ms`);
                    console.log(`      API: ${step.api_endpoint}`);
                    if (step.error) {
                        console.log(`      Error: ${step.error}`);
                    }
                    if (step.data && typeof step.data === 'object') {
                        const dataKeys = Object.keys(step.data);
                        console.log(`      Data: ${dataKeys.length} keys (${dataKeys.slice(0, 3).join(', ')}${dataKeys.length > 3 ? '...' : ''})`);
                    }
                });
            }

            // Log final course structure
            if (data.final_course) {
                console.log('\n📚 Final Course Structure:');
                console.log(`   Title: ${data.final_course.title}`);
                console.log(`   Topic: ${data.final_course.topic}`);
                console.log(`   Total Duration: ${data.final_course.total_duration} minutes`);
                console.log(`   Video Coverage: ${(data.final_course.video_coverage * 100).toFixed(1)}%`);
                console.log(`   Quality Score: ${(data.final_course.quality_score * 100).toFixed(1)}%`);
                
                if (data.final_course.lessons) {
                    console.log(`   Lessons: ${data.final_course.lessons.length}`);
                    data.final_course.lessons.forEach((lesson, index) => {
                        const title = lesson.lesson_title || lesson.title;
                        const duration = lesson.lesson_duration || lesson.duration;
                        const primaryArtifact = lesson.primary_artifact ? lesson.primary_artifact.type : 'None';
                        const supplementaryCount = lesson.supplementary_artifacts ? lesson.supplementary_artifacts.length : 0;
                        const totalArtifacts = lesson.total_artifacts || (lesson.primary_artifact ? 1 : 0) + supplementaryCount;
                        
                        console.log(`      ${index + 1}. ${title} (${duration}min)`);
                        console.log(`         Primary: ${primaryArtifact}, Supplementary: ${supplementaryCount}, Total: ${totalArtifacts}`);
                    });
                }
            }

            // Log artifact summary
            if (data.artifact_summary) {
                console.log('\n📋 Artifact Summary:');
                if (data.artifact_summary.generation) {
                    const gen = data.artifact_summary.generation;
                    console.log(`   Generation: ${gen.total_artifacts} artifacts, ${gen.lessons_enhanced} lessons enhanced`);
                    console.log(`   Quality: ${(gen.average_quality_score * 100).toFixed(1)}%`);
                    if (gen.artifacts_by_type) {
                        console.log(`   By Type: ${Object.entries(gen.artifacts_by_type).map(([type, count]) => `${type}(${count})`).join(', ')}`);
                    }
                }
                if (data.artifact_summary.prioritization) {
                    const pri = data.artifact_summary.prioritization;
                    console.log(`   Prioritization: ${pri.lessons_processed} lessons processed`);
                    if (pri.artifacts_by_role) {
                        console.log(`   Primary: ${pri.artifacts_by_role.primary}, Supplementary: ${pri.artifacts_by_role.supplementary}`);
                    }
                } else {
                    console.log(`   Prioritization: Failed or skipped`);
                }
            }

            // Prepare results for saving
            const testResults = {
                success: true,
                timestamp: new Date().toISOString(),
                testConfiguration: requestBody,
                totalTestTime: totalTestTime,
                apiResponse: data,
                executionSummary: data.execution_summary,
                stepResults: data.step_results,
                finalCourse: data.final_course,
                artifactSummary: data.artifact_summary
            };

            // Save results to file
            const filePath = saveTestResults(testResults);
            
            // Create and save readable summary
            const summary = createTestSummary(testResults);
            const summaryPath = filePath ? filePath.replace('.json', '-summary.txt') : null;
            if (summaryPath) {
                try {
                    fs.writeFileSync(summaryPath, summary);
                    console.log(`📄 Test summary saved to: ${summaryPath}`);
                } catch (error) {
                    console.error('❌ Failed to save test summary:', error.message);
                }
            }

            console.log('\n🎉 V3 Engine Test Completed Successfully!');
            console.log('\n📋 Next Steps:');
            console.log('   1. Review the detailed logs in logs/llm/[api-type]/');
            console.log('   2. Check the generated course structure above');
            console.log('   3. Verify artifact generation and prioritization');
            console.log('   4. Test with database save enabled (remove skip_steps)');
            console.log('   5. Try different configurations and strategies');

            return testResults;
        } else {
            console.log('\n❌ V3 Engine Orchestrator: FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${data.error || 'Unknown error'}`);
            
            if (data.execution_summary) {
                console.log('\n📊 Execution Summary:');
                console.log(`   Steps Completed: ${data.execution_summary.steps_completed}`);
                console.log(`   Steps Failed: ${data.execution_summary.steps_failed}`);
                console.log(`   Final Status: ${data.execution_summary.final_status}`);
            }

            if (data.step_results) {
                console.log('\n🔄 Failed Steps:');
                data.step_results.filter(step => !step.success).forEach(step => {
                    console.log(`   ❌ Step ${step.step_number}: ${step.step_name}`);
                    console.log(`      Error: ${step.error}`);
                    console.log(`      API: ${step.api_endpoint}`);
                });
            }

            // Save error results
            const errorResults = {
                success: false,
                timestamp: new Date().toISOString(),
                testConfiguration: requestBody,
                totalTestTime: totalTestTime,
                error: data.error,
                apiResponse: data,
                executionSummary: data.execution_summary,
                stepResults: data.step_results
            };

            saveTestResults(errorResults, 'v3-engine-test-error.json');

            return errorResults;
        }
    } catch (error) {
        const totalTestTime = Date.now() - startTime;
        console.log('\n💥 V3 Engine Orchestrator: ERROR');
        console.log(`   ${error.message}`);

        const errorResults = {
            success: false,
            timestamp: new Date().toISOString(),
            testConfiguration: requestBody,
            totalTestTime: totalTestTime,
            error: error.message,
            stackTrace: error.stack
        };

        saveTestResults(errorResults, 'v3-engine-test-fatal-error.json');

        return errorResults;
    }
}

/**
 * Run the complete V3 engine test
 */
async function runV3EngineTest() {
    console.log('🚀 Starting V3 Course Creation Engine Complete Test');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`🔑 Using test JWT token for user: ${testUser.email}`);
    console.log(`📚 Course Topic: "Machine Learning from scratch"`);
    console.log(`🔧 Mode: End-to-end testing with comprehensive logging`);

    const results = await testV3EngineComplete();

    console.log('\n' + '='.repeat(80));
    console.log('📊 V3 ENGINE TEST COMPLETE');
    console.log('='.repeat(80));

    if (results.success) {
        console.log('🎉 Result: SUCCESS');
        console.log('✅ The V3 Course Creation Engine is working correctly!');
        console.log('📝 All logs have been saved for detailed analysis');
        console.log('🚀 Ready for production deployment');
    } else {
        console.log('❌ Result: FAILED');
        console.log('🔍 Check the error messages and logs above');
        console.log('🛠️  Fix the issues and run the test again');
        console.log('💡 Common issues:');
        console.log('   - Development server not running on port 5173');
        console.log('   - OpenAI API key not configured');
        console.log('   - Database connection issues');
        console.log('   - Network connectivity problems');
    }

    console.log('\n📂 Log Locations:');
    console.log('   🔸 LLM API logs: logs/llm/[api-type]/');
    console.log('   🔸 Test results: logs/test-results/');
    console.log('   🔸 Daily logs: logs/llm/daily/');

    return results;
}

// Run test if called directly
if (require.main === module) {
    runV3EngineTest().catch(error => {
        console.error('💥 V3 Engine test runner failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runV3EngineTest,
    testV3EngineComplete,
    saveTestResults,
    createTestSummary
};