#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const logsDir = path.join(process.cwd(), 'logs', 'llm');

function listLogs() {
    console.log('📁 Current Log Organization:');
    console.log('============================\n');

    const apiTypes = [
        'keyword_generation',
        'lesson_youtube_discovery', 
        'keyword_video_discovery',
        'course_planning',
        'content_generation',
        'video_search'
    ];

    apiTypes.forEach(apiType => {
        const apiDir = path.join(logsDir, apiType);
        if (fs.existsSync(apiDir)) {
            const files = fs.readdirSync(apiDir)
                .filter(file => file.endsWith('.json'))
                .sort()
                .slice(-5); // Show last 5 files

            console.log(`�� ${apiType.toUpperCase()}:`);
            files.forEach(file => {
                console.log(`   �� ${file}`);
            });
            console.log('');
        }
    });
}

function migrateOldLogs() {
    console.log('🔄 Migrating old logs to new structure...');
    
    const oldLogsDir = path.join(logsDir);
    if (!fs.existsSync(oldLogsDir)) {
        console.log('No old logs found to migrate.');
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
        'daily'
    ];

    newDirs.forEach(dir => {
        const dirPath = path.join(logsDir, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });

    // Move old files to appropriate directories based on content
    const oldFiles = fs.readdirSync(oldLogsDir)
        .filter(file => file.endsWith('.json') && !file.includes('export'));

    oldFiles.forEach(file => {
        const filePath = path.join(oldLogsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        try {
            const logEntry = JSON.parse(content);
            const userPrompt = logEntry.request?.user_prompt || '';
            
            // Determine API type based on prompt content
            let apiType = 'unknown';
            if (userPrompt.includes('keyword') && userPrompt.includes('extract')) {
                apiType = 'keyword_generation';
            } else if (userPrompt.includes('video') && userPrompt.includes('lesson')) {
                apiType = 'lesson_youtube_discovery';
            } else if (userPrompt.includes('course') && userPrompt.includes('plan')) {
                apiType = 'course_planning';
            } else if (userPrompt.includes('content') && userPrompt.includes('generate')) {
                apiType = 'content_generation';
            } else if (userPrompt.includes('video') && userPrompt.includes('search')) {
                apiType = 'video_search';
            }

            // Extract topic
            const topic = extractTopic(userPrompt);
            const counter = getNextCounter(apiType);
            const newFileName = `${counter}-${topic}-${apiType.replace(/_/g, '-')}.json`;
            const newFilePath = path.join(logsDir, apiType, newFileName);

            fs.copyFileSync(filePath, newFilePath);
            console.log(`✅ Migrated: ${file} → ${apiType}/${newFileName}`);
        } catch (err) {
            console.log(`❌ Failed to migrate: ${file}`);
        }
    });
}

function extractTopic(prompt) {
    const courseTitleMatch = prompt.match(/Course Title[:\s]+([^\n]+)/i);
    if (courseTitleMatch) {
        return sanitizeFilename(courseTitleMatch[1].trim());
    }

    const keywordMatch = prompt.match(/Primary Keywords[:\s]+([^\n]+)/i);
    if (keywordMatch) {
        const keywords = keywordMatch[1].split(',').map(k => k.trim());
        return sanitizeFilename(keywords[0] || 'unknown');
    }

    return 'unknown';
}

function sanitizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
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

// CLI commands
const command = process.argv[2];

switch (command) {
    case 'list':
        listLogs();
        break;
    case 'migrate':
        migrateOldLogs();
        break;
    default:
        console.log('Usage: node manage-logs.js [list|migrate]');
        console.log('  list    - Show current log organization');
        console.log('  migrate - Migrate old logs to new structure');
}
