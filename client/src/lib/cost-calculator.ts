// Cost Calculator for AI API usage (OpenAI and Gemini)
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface CostInfo {
  total_cost: number;
  prompt_cost: number;
  completion_cost: number;
  tokens_used: TokenUsage;
  model: string;
  provider: string;
  currency: string;
}

// OpenAI pricing per 1K tokens (as of 2024)
const OPENAI_PRICING = {
  // GPT-4 models
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4o-search-preview-2025-03-11': { prompt: 0.005, completion: 0.015 },
  
  // GPT-3.5 models
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
  
  // Default fallback
  'default': { prompt: 0.01, completion: 0.03 }
};

// Gemini pricing per 1K tokens (as of 2024)
const GEMINI_PRICING = {
  'gemini-2.5-pro': { prompt: 0.00125, completion: 0.005 },
  'gemini-2.0-flash-exp': { prompt: 0.000075, completion: 0.0003 },
  'gemini-1.5-pro': { prompt: 0.00125, completion: 0.005 },
  'gemini-1.5-flash': { prompt: 0.000075, completion: 0.0003 },
  
  // Default fallback
  'default': { prompt: 0.00125, completion: 0.005 }
};

export function calculateAICost(
  usage: TokenUsage,
  model: string,
  provider: 'openai' | 'gemini' = 'openai'
): CostInfo {
  // Get pricing for the model based on provider
  let pricing;
  if (provider === 'gemini') {
    pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING] || GEMINI_PRICING.default;
  } else {
    pricing = OPENAI_PRICING[model as keyof typeof OPENAI_PRICING] || OPENAI_PRICING.default;
  }
  
  // Calculate costs per 1K tokens
  const promptCost = (usage.prompt_tokens / 1000) * pricing.prompt;
  const completionCost = (usage.completion_tokens / 1000) * pricing.completion;
  const totalCost = promptCost + completionCost;
  
  return {
    total_cost: totalCost,
    prompt_cost: promptCost,
    completion_cost: completionCost,
    tokens_used: usage,
    model,
    provider,
    currency: 'USD'
  };
}

// Backward compatibility
export function calculateOpenAICost(
  usage: TokenUsage,
  model: string
): CostInfo {
  return calculateAICost(usage, model, 'openai');
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

export function getModelPricing(model: string): { prompt: number; completion: number } {
  return OPENAI_PRICING[model as keyof typeof OPENAI_PRICING] || OPENAI_PRICING.default;
}
