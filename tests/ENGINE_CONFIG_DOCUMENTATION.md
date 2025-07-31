# Engine Configuration System Documentation

## 🎯 **Overview**

The `engine.config.ts` file provides a centralized configuration system for all engine APIs, making it easy to manage parameters, settings, and behavior across the entire application.

## 📁 **File Location**

```
client/src/lib/engine.config.ts
```

## 🔧 **Configuration Categories**

### 1. **OpenAI Configuration** (`OPENAI_CONFIG`)

Manages OpenAI API settings for different operations:

```typescript
export const OPENAI_CONFIG = {
    default_model: 'gpt-4',
    models: {
        keyword_extraction: 'gpt-4o-mini',
        video_discovery: 'gpt-4',
        course_planning: 'gpt-4',
        content_generation: 'gpt-4',
        lesson_planning: 'gpt-4'
    },
    parameters: {
        keyword_extraction: {
            temperature: 0.2,
            max_tokens: 2000,
            timeout: 30000
        },
        video_discovery: {
            temperature: 0.3,
            max_tokens: 1500,
            timeout: 45000
        }
        // ... more operations
    }
};
```

### 2. **YouTube Discovery Configuration** (`YOUTUBE_DISCOVERY_CONFIG`)

Controls video discovery behavior:

```typescript
export const YOUTUBE_DISCOVERY_CONFIG = {
    default_preferred_duration: 8, // minutes
    default_quality_preference: 'educational',
    default_max_retries: 3,
    
    quality_preferences: {
        educational: {
            description: 'prioritize clear, structured educational content',
            confidence_threshold: 0.6
        },
        engaging: {
            description: 'prioritize entertaining and engaging content',
            confidence_threshold: 0.5
        },
        authoritative: {
            description: 'prioritize content from recognized experts',
            confidence_threshold: 0.7
        }
    },
    
    validation: {
        min_success_rate: 0.7,
        fallback_confidence: 0.4,
        default_duration: 600
    },
    
    keyword_integration: {
        enabled_by_default: false,
        primary_keyword_weight: 1.0,
        video_search_term_weight: 0.9
    }
};
```

### 3. **Keyword Extraction Configuration** (`KEYWORD_EXTRACTION_CONFIG`)

Manages keyword generation parameters:

```typescript
export const KEYWORD_EXTRACTION_CONFIG = {
    default_audience: 'intermediate',
    default_depth: 'comprehensive',
    
    audiences: {
        beginner: {
            keyword_count: {
                primary: 5,
                secondary: 8,
                long_tail: 12,
                video_search: 15,
                excluded: 3
            }
        },
        intermediate: {
            keyword_count: {
                primary: 8,
                secondary: 12,
                long_tail: 18,
                video_search: 20,
                excluded: 5
            }
        }
        // ... advanced level
    },
    
    depths: {
        basic: { keyword_multiplier: 0.6 },
        standard: { keyword_multiplier: 0.8 },
        comprehensive: { keyword_multiplier: 1.0 },
        extensive: { keyword_multiplier: 1.2 }
    }
};
```

### 4. **Performance Configuration** (`PERFORMANCE_CONFIG`)

Controls timeouts, caching, and optimization:

```typescript
export const PERFORMANCE_CONFIG = {
    timeouts: {
        short_operation: 15000,  // 15 seconds
        medium_operation: 30000, // 30 seconds
        long_operation: 60000,   // 60 seconds
        very_long_operation: 120000 // 2 minutes
    },
    
    caching: {
        enabled: true,
        ttl: 3600000, // 1 hour
        max_cache_size: 100 // MB
    },
    
    optimization: {
        parallel_requests: true,
        batch_processing: true,
        request_batching: {
            max_batch_size: 10,
            batch_timeout: 5000
        }
    }
};
```

### 5. **Environment Configuration** (`ENV_CONFIG`)

Environment-specific overrides:

```typescript
export const ENV_CONFIG = {
    development: {
        logging: { debug: true, verbose: true },
        performance: {
            timeouts: {
                short_operation: 30000, // Longer for debugging
                medium_operation: 60000
            }
        }
    },
    production: {
        logging: { debug: false, verbose: false },
        performance: {
            caching: { enabled: true, ttl: 7200000 }
        }
    },
    test: {
        logging: { debug: false, verbose: false },
        performance: {
            timeouts: {
                short_operation: 5000, // Shorter for tests
                medium_operation: 10000
            }
        }
    }
};
```

## 🛠️ **Helper Functions** (`CONFIG_HELPERS`)

### `getOperationConfig(operation)`

Get configuration for a specific operation:

```typescript
const videoConfig = CONFIG_HELPERS.getOperationConfig('video_discovery');
// Returns: { model: 'gpt-4', temperature: 0.3, max_tokens: 1500, timeout: 45000 }
```

### `getYouTubeDiscoveryConfig(overrides)`

Get YouTube discovery config with optional overrides:

```typescript
const config = CONFIG_HELPERS.getYouTubeDiscoveryConfig({
    default_preferred_duration: 10,
    default_quality_preference: 'authoritative'
});
```

### `getKeywordExtractionConfig(audience, depth)`

Get keyword extraction config for specific audience and depth:

```typescript
const config = CONFIG_HELPERS.getKeywordExtractionConfig('intermediate', 'comprehensive');
// Returns audience and depth specific configuration
```

### `getEnvConfig()`

Get environment-specific configuration:

```typescript
const envConfig = CONFIG_HELPERS.getEnvConfig();
// Returns configuration based on NODE_ENV
```

## 📝 **Usage Examples**

### In YouTube Discovery API

```typescript
import { 
    OPENAI_CONFIG, 
    YOUTUBE_DISCOVERY_CONFIG, 
    CONFIG_HELPERS 
} from '$lib/engine.config';

// Get operation-specific config
const videoConfig = CONFIG_HELPERS.getOperationConfig('video_discovery');

const openAIRequest = {
    model: videoConfig.model,
    max_tokens: videoConfig.max_tokens,
    temperature: videoConfig.temperature
};

// Use default values from config
const { 
    preferred_duration = YOUTUBE_DISCOVERY_CONFIG.default_preferred_duration,
    quality_preference = YOUTUBE_DISCOVERY_CONFIG.default_quality_preference,
    max_retries = YOUTUBE_DISCOVERY_CONFIG.default_max_retries
} = requestBody;
```

### In Keyword Extraction API

```typescript
import { 
    OPENAI_CONFIG, 
    KEYWORD_EXTRACTION_CONFIG, 
    CONFIG_HELPERS 
} from '$lib/engine.config';

// Get operation-specific config
const keywordConfig = CONFIG_HELPERS.getOperationConfig('keyword_extraction');

// Use default values
const { 
    audience = KEYWORD_EXTRACTION_CONFIG.default_audience,
    depth = KEYWORD_EXTRACTION_CONFIG.default_depth
} = requestBody;

// Get audience-specific keyword counts
const audienceConfig = KEYWORD_EXTRACTION_CONFIG.audiences[audience];
const expectedKeywords = audienceConfig.keyword_count.primary;
```

## 🔄 **Integration with APIs**

### Updated APIs

The following APIs now use the centralized configuration:

1. **YouTube Discovery API** (`/api/engine/lesson_youtube_discovery`)
   - Uses `YOUTUBE_DISCOVERY_CONFIG` for defaults
   - Uses `OPENAI_CONFIG.parameters.video_discovery` for OpenAI settings
   - Supports keyword integration with configurable weights

2. **Keyword Extraction API** (`/api/engine/v3/keyword_generation`)
   - Uses `KEYWORD_EXTRACTION_CONFIG` for audience and depth settings
   - Uses `OPENAI_CONFIG.parameters.keyword_extraction` for OpenAI settings
   - Supports different keyword counts based on audience level

### Benefits of Integration

✅ **Consistency**: All APIs use the same parameter values
✅ **Maintainability**: Change settings in one place
✅ **Type Safety**: TypeScript ensures correct configuration usage
✅ **Environment Support**: Different settings for dev/prod/test
✅ **Flexibility**: Easy to override defaults when needed

## 🧪 **Testing Configuration**

### Test Script

```bash
cd tests
node test-engine-config.js
```

This test demonstrates:
- Keyword extraction using centralized config
- YouTube discovery with keyword integration
- Configuration benefits and usage examples

### Manual Testing

```typescript
// Test configuration access
import { CONFIG_HELPERS } from '$lib/engine.config';

// Get video discovery config
const videoConfig = CONFIG_HELPERS.getOperationConfig('video_discovery');
console.log('Video config:', videoConfig);

// Get environment config
const envConfig = CONFIG_HELPERS.getEnvConfig();
console.log('Environment config:', envConfig);
```

## 🔧 **Customization**

### Adding New Operations

1. Add to `OPENAI_CONFIG.models`:
```typescript
models: {
    // ... existing models
    new_operation: 'gpt-4'
}
```

2. Add to `OPENAI_CONFIG.parameters`:
```typescript
parameters: {
    // ... existing parameters
    new_operation: {
        temperature: 0.3,
        max_tokens: 1500,
        timeout: 30000
    }
}
```

### Adding New Configuration Categories

```typescript
export const NEW_CONFIG = {
    default_setting: 'value',
    options: {
        option1: { description: '...', value: '...' },
        option2: { description: '...', value: '...' }
    }
};
```

### Environment-Specific Overrides

```typescript
export const ENV_CONFIG = {
    development: {
        // ... existing config
        new_config: { debug: true }
    },
    production: {
        // ... existing config
        new_config: { debug: false }
    }
};
```

## 📊 **Configuration Hierarchy**

1. **Environment-specific overrides** (highest priority)
2. **Operation-specific parameters**
3. **Default values** (lowest priority)

Example:
```typescript
// Development environment overrides
const envConfig = CONFIG_HELPERS.getEnvConfig();
const timeouts = envConfig.performance.timeouts;

// Operation-specific config
const operationConfig = CONFIG_HELPERS.getOperationConfig('video_discovery');

// Final config combines all levels
const finalConfig = {
    ...operationConfig,
    timeout: timeouts.medium_operation // Override with env-specific value
};
```

## 🚀 **Best Practices**

1. **Always use helper functions** for configuration access
2. **Set sensible defaults** for all parameters
3. **Use TypeScript** for type safety
4. **Document new configurations** with clear descriptions
5. **Test configuration changes** in all environments
6. **Use environment variables** for sensitive settings
7. **Keep configurations modular** and focused

## ✅ **Ready to Use**

The centralized configuration system is now fully integrated and ready for use across all engine APIs. It provides:

- **Consistent parameter management**
- **Environment-specific overrides**
- **Type-safe configuration access**
- **Helper functions for common operations**
- **Easy customization and extension**

**Next steps:**
1. Test the configuration: `node test-engine-config.js`
2. Customize settings as needed
3. Add new configurations for future APIs
4. Enjoy centralized parameter management! 🎯 