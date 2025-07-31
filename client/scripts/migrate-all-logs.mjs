#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '..', 'logs', 'llm');

function migrateAllOldLogs() {
    console.log('🔄 Migrating ALL old logs to new structure...');
    
    if (!fs.existsSync(logsDir)) {
        console.log('No logs directory found.');
        return;
    }

    // Create new structure
    const newDirs = [
        'keyword_generation',
        'lesson_youtube_discovery', 
        'keyword_video_discovery',
        'course_planning',
        'content_generation',
        'video_search',
        'daily',
        'unknown' // For files we can't categorize
    ];

    newDirs.forEach(dir => {
        const dirPath = path.join(logsDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });

    // Get all old timestamp-based files (simpler pattern)
    const oldFiles = fs.readdirSync(logsDir)
        .filter(file => file.startsWith('2025-07') && file.endsWith('.json'))
        .sort();

    console.log(`Found ${oldFiles.length} old timestamp-based files to migrate...`);

    let migratedCount = 0;
    let failedCount = 0;

    oldFiles.forEach(file => {
        const filePath = path.join(logsDir, file);
        
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const logEntry = JSON.parse(content);
            
            // Determine API type based on various clues
            let apiType = determineApiType(logEntry);
            let topic = extractTopic(logEntry);
            
            // Get next counter for this API type
            const counter = getNextCounter(apiType);
            const newFileName = `${counter}-${topic}-${apiType.replace(/_/g, '-')}.json`;
            const newFilePath = path.join(logsDir, apiType, newFileName);

            // Copy the file to new location
            fs.copyFileSync(filePath, newFilePath);
            
            // Delete the old file
            fs.unlinkSync(filePath);
            
            console.log(`✅ Migrated: ${file} → ${apiType}/${newFileName}`);
            migratedCount++;
            
        } catch (err) {
            console.log(`❌ Failed to migrate: ${file} - ${err.message}`);
            failedCount++;
            
            // Move to unknown folder as fallback
            try {
                const unknownDir = path.join(logsDir, 'unknown');
                const fallbackName = `failed-${file}`;
                const fallbackPath = path.join(unknownDir, fallbackName);
                fs.copyFileSync(filePath, fallbackPath);
                console.log(`   📁 Moved to unknown/${fallbackName}`);
            } catch (fallbackErr) {
                console.log(`   💥 Could not move to unknown folder either`);
            }
        }
    });

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} files`);
    console.log(`   ❌ Failed to migrate: ${failedCount} files`);
    console.log(`   📁 Check 'unknown' folder for failed migrations`);
}

function determineApiType(logEntry) {
    // Try to extract API type from various sources
    const userPrompt = logEntry.request?.user_prompt || '';
    const logId = logEntry.log_id || '';
    const apiType = logEntry.api_type || '';
    
    // Check log_id first
    if (logId) {
        if (logId.includes('keyword') || logId.includes('extraction')) return 'keyword_generation';
        if (logId.includes('video') || logId.includes('youtube')) return 'lesson_youtube_discovery';
        if (logId.includes('course') || logId.includes('plan')) return 'course_planning';
        if (logId.includes('content') || logId.includes('generate')) return 'content_generation';
        if (logId.includes('search')) return 'video_search';
    }
    
    // Check api_type field
    if (apiType) {
        return apiType;
    }
    
    // Check user prompt content
    if (userPrompt.includes('keyword') && userPrompt.includes('extract')) return 'keyword_generation';
    if (userPrompt.includes('video') && userPrompt.includes('lesson')) return 'lesson_youtube_discovery';
    if (userPrompt.includes('course') && userPrompt.includes('plan')) return 'course_planning';
    if (userPrompt.includes('content') && userPrompt.includes('generate')) return 'content_generation';
    if (userPrompt.includes('video') && userPrompt.includes('search')) return 'video_search';
    if (userPrompt.includes('creationism') || userPrompt.includes('keyword')) return 'keyword_generation';
    
    // Default fallback
    return 'unknown';
}

function extractTopic(logEntry) {
    const userPrompt = logEntry.request?.user_prompt || '';
    
    // Try to extract course title
    const courseTitleMatch = userPrompt.match(/Course Title[:\s]+([^\n]+)/i);
    if (courseTitleMatch) {
        return sanitizeFilename(courseTitleMatch[1].trim());
    }

    // Try to extract from keyword cloud
    const keywordMatch = userPrompt.match(/Primary Keywords[:\s]+([^\n]+)/i);
    if (keywordMatch) {
        const keywords = keywordMatch[1].split(',').map(k => k.trim());
        return sanitizeFilename(keywords[0] || 'unknown');
    }

    // Try to extract from lesson titles
    const lessonMatch = userPrompt.match(/Lesson \d+[:\s]+([^\n]+)/i);
    if (lessonMatch) {
        return sanitizeFilename(lessonMatch[1].trim());
    }

    // Try to extract from course name in prompt
    const courseMatch = userPrompt.match(/course[:\s]+([^\n]+)/i);
    if (courseMatch) {
        return sanitizeFilename(courseMatch[1].trim());
    }

    // Fallback: extract first meaningful words
    const words = userPrompt.split(/\s+/).slice(0, 3).join('-');
    return sanitizeFilename(words || 'unknown');
}

function sanitizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .substring(0, 50); // Limit length
}

function getNextCounter(apiType) {
    const apiDir = path.join(logsDir, apiType);
    if (!fs.existsSync(apiDir)) return 1;
    
    const files = fs.readdirSync(apiDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
            const match = file.match(/^(\d+)-/);
            return match ? parseInt(match[1]) : 0;
        });
    
    return files.length > 0 ? Math.max(...files) + 1 : 1;
}

// Run the migration
migrateAllOldLogs();
