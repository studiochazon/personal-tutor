/**
 * Engine Configuration
 * Centralized configuration for all engine APIs
 */

// AI Provider Configuration
export const AI_PROVIDERS = {
    openai: 'openai',
    gemini: 'gemini'
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

// OpenAI Model Configuration
export const OPENAI_CONFIG = {
    // Default model for most operations
    default_model: 'gpt-4',
    
    // Model for specific operations
    models: {
        keyword_extraction: 'gpt-4o-mini',
        video_discovery: 'gpt-4',
        course_planning: 'gpt-4',
        content_generation: 'gpt-4',
        lesson_planning: 'gpt-4'
    },
    
    // Default parameters
    default_temperature: 0.3,
    default_max_tokens: 1500,
    
    // Operation-specific parameters
    parameters: {
        keyword_extraction: {
            temperature: 0.2,
            max_tokens: 2000,
            timeout: 30000 // 30 seconds
        },
        video_discovery: {
            temperature: 0.3,
            max_tokens: 4000,
            timeout: 45000 // 45 seconds
        },
        course_planning: {
            temperature: 0.4,
            max_tokens: 3000,
            timeout: 60000 // 60 seconds
        },
        content_generation: {
            temperature: 0.5,
            max_tokens: 4000,
            timeout: 90000 // 90 seconds
        },
        lesson_planning: {
            temperature: 0.3,
            max_tokens: 2500,
            timeout: 45000 // 45 seconds
        }
    }
};

// Gemini Model Configuration
export const GEMINI_CONFIG = {
    // Default model for most operations
    default_model: 'gemini-2.5-pro',
    
    // Model for specific operations
    models: {
        keyword_extraction: 'gemini-2.5-pro',
        video_discovery: 'gemini-2.5-pro',
        course_planning: 'gemini-2.5-pro',
        content_generation: 'gemini-2.5-pro',
        lesson_planning: 'gemini-2.5-pro'
    },
    
    // Default parameters
    default_temperature: 0.3,
    default_max_tokens: 1500,
    
    // Operation-specific parameters
    parameters: {
        keyword_extraction: {
            temperature: 0.2,
            max_tokens: 2000,
            timeout: 30000 // 30 seconds
        },
        video_discovery: {
            temperature: 0.3,
            max_tokens: 4000,
            timeout: 45000 // 45 seconds
        },
        course_planning: {
            temperature: 0.4,
            max_tokens: 3000,
            timeout: 60000 // 60 seconds
        },
        content_generation: {
            temperature: 0.5,
            max_tokens: 4000,
            timeout: 90000 // 90 seconds
        },
        lesson_planning: {
            temperature: 0.3,
            max_tokens: 2500,
            timeout: 45000 // 45 seconds
        }
    }
};

// Provider Selection Configuration
export const PROVIDER_CONFIG = {
    // Which provider to use for each operation
    providers: {
        keyword_extraction: AI_PROVIDERS.openai,
        video_discovery: AI_PROVIDERS.gemini, // Using Gemini for YouTube discovery
        course_planning: AI_PROVIDERS.openai,
        content_generation: AI_PROVIDERS.openai,
        lesson_planning: AI_PROVIDERS.openai
    }
};

// YouTube Discovery Configuration
export const YOUTUBE_DISCOVERY_CONFIG = {
    // Default settings
    default_preferred_duration: 8, // minutes
    default_quality_preference: 'educational' as const,
    default_max_retries: 3,
    
    // Quality preferences
    quality_preferences: {
        educational: {
            description: 'prioritize clear, structured educational content from reputable channels',
            confidence_threshold: 0.6
        },
        engaging: {
            description: 'prioritize entertaining and engaging content that maintains educational value',
            confidence_threshold: 0.5
        },
        authoritative: {
            description: 'prioritize content from recognized experts, institutions, or authoritative sources',
            confidence_threshold: 0.7
        }
    },
    
    // Video validation settings
    validation: {
        min_success_rate: 0.7, // 70% of videos must be valid
        fallback_confidence: 0.4,
        default_duration: 600, // 10 minutes in seconds
        platform: 'youtube' as const
    },
    
    // Retry configuration
    retry: {
        max_attempts: 3,
        delay_between_attempts: 2000, // 2 seconds
        backoff_multiplier: 1.5
    },
    
    // Keyword integration settings
    keyword_integration: {
        enabled_by_default: false,
        primary_keyword_weight: 1.0,
        video_search_term_weight: 0.9,
        secondary_keyword_weight: 0.7,
        long_tail_keyword_weight: 0.8,
        excluded_term_penalty: -0.5
    }
};

// Keyword Extraction Configuration
export const KEYWORD_EXTRACTION_CONFIG = {
    // Default settings
    default_audience: 'intermediate',
    default_depth: 'comprehensive',
    
    // Audience levels
    audiences: {
        beginner: {
            keyword_count: {
                primary: 5,
                secondary: 8,
                long_tail: 12,
                video_search: 15,
                excluded: 3
            },
            complexity: 'simple'
        },
        intermediate: {
            keyword_count: {
                primary: 8,
                secondary: 12,
                long_tail: 18,
                video_search: 20,
                excluded: 5
            },
            complexity: 'moderate'
        },
        advanced: {
            keyword_count: {
                primary: 10,
                secondary: 15,
                long_tail: 25,
                video_search: 30,
                excluded: 8
            },
            complexity: 'detailed'
        }
    },
    
    // Depth levels
    depths: {
        basic: {
            description: 'Essential keywords only',
            keyword_multiplier: 0.6
        },
        standard: {
            description: 'Balanced keyword coverage',
            keyword_multiplier: 0.8
        },
        comprehensive: {
            description: 'Complete keyword analysis',
            keyword_multiplier: 1.0
        },
        extensive: {
            description: 'Maximum keyword coverage',
            keyword_multiplier: 1.2
        }
    },
    
    // Keyword categories
    categories: {
        primary_keywords: {
            description: 'Core topic keywords',
            max_length: 3, // words per keyword
            min_relevance: 0.8
        },
        secondary_keywords: {
            description: 'Supporting topic keywords',
            max_length: 4,
            min_relevance: 0.6
        },
        long_tail_keywords: {
            description: 'Specific phrases and concepts',
            max_length: 6,
            min_relevance: 0.5
        },
        video_search_terms: {
            description: 'Optimized for video discovery',
            max_length: 5,
            min_relevance: 0.7
        },
        excluded_terms: {
            description: 'Terms to avoid in searches',
            max_length: 3,
            min_relevance: 0.3
        }
    }
};

// Course Planning Configuration
export const COURSE_PLANNING_CONFIG = {
    // Default settings
    default_lesson_count: 8,
    default_lesson_duration: 30, // minutes
    default_audience: 'intermediate',
    
    // Course structure
    structure: {
        min_lessons: 3,
        max_lessons: 20,
        min_lesson_duration: 15,
        max_lesson_duration: 120
    },
    
    // Content types
    content_types: {
        lecture: {
            duration_multiplier: 1.0,
            video_required: true
        },
        tutorial: {
            duration_multiplier: 1.2,
            video_required: true
        },
        workshop: {
            duration_multiplier: 1.5,
            video_required: false
        },
        discussion: {
            duration_multiplier: 0.8,
            video_required: false
        }
    }
};

// Content Generation Configuration
export const CONTENT_GENERATION_CONFIG = {
    // Default settings
    default_style: 'educational',
    default_tone: 'professional',
    
    // Content styles
    styles: {
        educational: {
            description: 'Clear, structured learning content',
            temperature: 0.3,
            max_tokens: 3000
        },
        conversational: {
            description: 'Engaging, dialogue-based content',
            temperature: 0.5,
            max_tokens: 2500
        },
        technical: {
            description: 'Detailed, technical explanations',
            temperature: 0.2,
            max_tokens: 4000
        },
        storytelling: {
            description: 'Narrative-driven content',
            temperature: 0.6,
            max_tokens: 2000
        }
    },
    
    // Content tones
    tones: {
        professional: {
            description: 'Formal, authoritative tone',
            formality_level: 0.9
        },
        friendly: {
            description: 'Warm, approachable tone',
            formality_level: 0.3
        },
        academic: {
            description: 'Scholarly, research-based tone',
            formality_level: 0.95
        },
        casual: {
            description: 'Relaxed, informal tone',
            formality_level: 0.1
        }
    }
};

// API Rate Limiting Configuration
export const RATE_LIMITING_CONFIG = {
    // OpenAI API limits
    openai: {
        requests_per_minute: 60,
        requests_per_hour: 3500,
        tokens_per_minute: 90000,
        concurrent_requests: 5
    },
    
    // YouTube API limits (if using YouTube Data API)
    youtube: {
        requests_per_day: 10000,
        requests_per_second: 5
    },
    
    // Custom rate limiting
    custom: {
        max_concurrent_requests: 10,
        request_timeout: 30000, // 30 seconds
        retry_delay: 1000 // 1 second
    }
};

// Logging Configuration
export const LOGGING_CONFIG = {
    // Log levels
    levels: {
        error: true,
        warn: true,
        info: true,
        debug: process.env.NODE_ENV === 'development'
    },
    
    // Log categories
    categories: {
        api_calls: true,
        performance: true,
        errors: true,
        user_actions: true
    },
    
    // Log retention
    retention: {
        max_log_files: 100,
        max_file_size: '10MB',
        cleanup_interval: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// Error Handling Configuration
export const ERROR_HANDLING_CONFIG = {
    // Error types
    error_types: {
        openai_api: {
            retry: true,
            max_retries: 3,
            backoff_multiplier: 2
        },
        network: {
            retry: true,
            max_retries: 5,
            backoff_multiplier: 1.5
        },
        validation: {
            retry: false,
            log_level: 'warn'
        },
        authentication: {
            retry: false,
            log_level: 'error'
        }
    },
    
    // Fallback strategies
    fallbacks: {
        video_discovery: {
            use_curated_list: true,
            use_generic_videos: true
        },
        keyword_extraction: {
            use_basic_keywords: true,
            use_topic_keywords: true
        },
        content_generation: {
            use_templates: true,
            use_simplified_content: true
        }
    }
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
    // Timeouts
    timeouts: {
        short_operation: 15000, // 15 seconds
        medium_operation: 30000, // 30 seconds
        long_operation: 60000, // 60 seconds
        very_long_operation: 120000 // 2 minutes
    },
    
    // Caching
    caching: {
        enabled: true,
        ttl: 3600000, // 1 hour
        max_cache_size: 100 // MB
    },
    
    // Optimization
    optimization: {
        parallel_requests: true,
        batch_processing: true,
        request_batching: {
            max_batch_size: 10,
            batch_timeout: 5000 // 5 seconds
        }
    }
};

// Environment-specific overrides
export const ENV_CONFIG = {
    development: {
        logging: {
            debug: true,
            verbose: true
        },
        performance: {
            timeouts: {
                short_operation: 30000, // Longer timeouts for debugging
                medium_operation: 60000
            }
        }
    },
    production: {
        logging: {
            debug: false,
            verbose: false
        },
        performance: {
            caching: {
                enabled: true,
                ttl: 7200000 // 2 hours
            }
        }
    },
    test: {
        logging: {
            debug: false,
            verbose: false
        },
        performance: {
            timeouts: {
                short_operation: 5000, // Shorter timeouts for tests
                medium_operation: 10000
            }
        }
    }
};

// Helper functions
export const CONFIG_HELPERS = {
    /**
     * Get configuration for a specific operation (supports multiple providers)
     */
    getOperationConfig(operation: keyof typeof OPENAI_CONFIG.parameters) {
        const provider = PROVIDER_CONFIG.providers[operation];
        
        if (provider === AI_PROVIDERS.gemini) {
            return {
                provider: 'gemini',
                model: GEMINI_CONFIG.models[operation] || GEMINI_CONFIG.default_model,
                ...GEMINI_CONFIG.parameters[operation]
            };
        } else {
            return {
                provider: 'openai',
                model: OPENAI_CONFIG.models[operation] || OPENAI_CONFIG.default_model,
                ...OPENAI_CONFIG.parameters[operation]
            };
        }
    },
    
    /**
     * Get YouTube discovery configuration with overrides
     */
    getYouTubeDiscoveryConfig(overrides: Partial<typeof YOUTUBE_DISCOVERY_CONFIG> = {}) {
        return {
            ...YOUTUBE_DISCOVERY_CONFIG,
            ...overrides
        };
    },
    
    /**
     * Get keyword extraction configuration
     */
    getKeywordExtractionConfig(audience: keyof typeof KEYWORD_EXTRACTION_CONFIG.audiences, depth: keyof typeof KEYWORD_EXTRACTION_CONFIG.depths) {
        return {
            audience: KEYWORD_EXTRACTION_CONFIG.audiences[audience],
            depth: KEYWORD_EXTRACTION_CONFIG.depths[depth],
            categories: KEYWORD_EXTRACTION_CONFIG.categories
        };
    },
    
    /**
     * Get environment-specific configuration
     */
    getEnvConfig() {
        const env = process.env.NODE_ENV || 'development';
        return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
    }
};

// Export all configurations
export default {
    OPENAI_CONFIG,
    YOUTUBE_DISCOVERY_CONFIG,
    KEYWORD_EXTRACTION_CONFIG,
    COURSE_PLANNING_CONFIG,
    CONTENT_GENERATION_CONFIG,
    RATE_LIMITING_CONFIG,
    LOGGING_CONFIG,
    ERROR_HANDLING_CONFIG,
    PERFORMANCE_CONFIG,
    ENV_CONFIG,
    CONFIG_HELPERS
}; 