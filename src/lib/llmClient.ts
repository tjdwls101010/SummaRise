import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { createPureClient } from './supabase/server';

export interface LLMApiKey {
  id: number;
  provider: 'gemini' | 'openai';
  key_encrypted: string;
  priority_order: number;
  is_active: boolean;
}

export interface SummarizationResult {
  summary: string;
  provider_used: string;
  tokens_used?: number;
}

export interface LLMError {
  code: 'RATE_LIMIT' | 'AUTH_FAILED' | 'QUOTA_EXCEEDED' | 'API_ERROR' | 'NO_KEYS' | 'ALL_FAILED';
  message: string;
  provider?: string;
  originalError?: unknown;
}

/**
 * Default system prompt for content summarization
 */
const DEFAULT_SYSTEM_PROMPT = `당신은 전문적인 콘텐츠 요약 AI입니다. 다음 지침에 따라 콘텐츠를 요약해주세요:

1. 핵심 내용을 3-5개의 주요 포인트로 구조화하여 설명
2. 기술적 내용의 경우 구체적인 기술명과 개념을 포함
3. 실용적인 정보나 행동 지침이 있다면 명확히 제시
4. 불필요한 부가 설명보다는 핵심에 집중
5. 한국어로 명확하고 간결하게 작성

요약 결과는 마크다운 형식으로 작성하되, 읽기 쉽게 구조화해주세요.`;

/**
 * Utility to retry async operations with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Simple encryption/decryption for API keys (for demo purposes)
 * In production, use proper encryption with Supabase Vault
 */
function decryptApiKey(encryptedKey: string): string {
  // For now, we'll assume keys are base64 encoded
  // In production, implement proper decryption
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return encryptedKey; // Fallback to plain text for development
  }
}

/**
 * Load API keys from Supabase, ordered by priority
 */
async function loadApiKeys(): Promise<LLMApiKey[]> {
  const supabase = await createPureClient();
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true)
    .order('priority_order', { ascending: true });

  if (error) {
    console.error('Failed to load API keys:', error);
    throw new Error('Failed to load API keys from database');
  }

  return data || [];
}

/**
 * Get system prompt from database or use default
 */
async function getSystemPrompt(): Promise<string> {
  try {
    const supabase = await createPureClient();
    
    const { data, error } = await supabase
      .from('system_prompts')
      .select('prompt_text')
      .eq('is_current', true)
      .limit(1)
      .single();

    if (error || !data) {
      return DEFAULT_SYSTEM_PROMPT;
    }

    return data.prompt_text;
  } catch (error) {
    console.warn('Failed to load system prompt, using default:', error);
    return DEFAULT_SYSTEM_PROMPT;
  }
}

/**
 * Call Gemini API with specific key
 */
async function callGemini(apiKey: string, content: string, systemPrompt: string): Promise<SummarizationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-pro',
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });

  try {
    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent([
        { text: systemPrompt },
        { text: `다음 콘텐츠를 요약해주세요:\n\n${content}` }
      ]);
      return response;
    });

    const summary = result.response.text();
    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    return {
      summary: summary.trim(),
      provider_used: 'gemini-1.5-pro',
      tokens_used: result.response.usageMetadata?.totalTokenCount
    };

  } catch (error: any) {
    // Handle specific Gemini API errors
    if (error.message?.includes('quota')) {
      const llmError: LLMError = {
        code: 'QUOTA_EXCEEDED',
        message: 'Gemini API quota exceeded',
        provider: 'gemini',
        originalError: error
      };
      throw llmError;
    }
    
    if (error.message?.includes('rate limit') || error.status === 429) {
      const llmError: LLMError = {
        code: 'RATE_LIMIT',
        message: 'Gemini API rate limit exceeded',
        provider: 'gemini',
        originalError: error
      };
      throw llmError;
    }
    
    if (error.status === 401 || error.message?.includes('auth')) {
      const llmError: LLMError = {
        code: 'AUTH_FAILED',
        message: 'Gemini API authentication failed',
        provider: 'gemini',
        originalError: error
      };
      throw llmError;
    }

    const llmError: LLMError = {
      code: 'API_ERROR',
      message: `Gemini API error: ${error.message}`,
      provider: 'gemini',
      originalError: error
    };
    throw llmError;
  }
}

/**
 * Call OpenAI API with specific key
 */
async function callOpenAI(apiKey: string, content: string, systemPrompt: string): Promise<SummarizationResult> {
  const openai = new OpenAI({ apiKey });

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `다음 콘텐츠를 요약해주세요:\n\n${content}` }
        ],
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 0.8
      });
    });

    const summary = response.choices[0]?.message?.content;
    if (!summary || summary.trim().length === 0) {
      throw new Error('Empty response from OpenAI API');
    }

    return {
      summary: summary.trim(),
      provider_used: 'gpt-4o',
      tokens_used: response.usage?.total_tokens
    };

  } catch (error: any) {
    // Handle specific OpenAI API errors
    if (error.code === 'insufficient_quota' || error.type === 'insufficient_quota') {
      const llmError: LLMError = {
        code: 'QUOTA_EXCEEDED',
        message: 'OpenAI API quota exceeded',
        provider: 'openai',
        originalError: error
      };
      throw llmError;
    }
    
    if (error.code === 'rate_limit_exceeded' || error.status === 429) {
      const llmError: LLMError = {
        code: 'RATE_LIMIT',
        message: 'OpenAI API rate limit exceeded',
        provider: 'openai',
        originalError: error
      };
      throw llmError;
    }
    
    if (error.status === 401 || error.code === 'invalid_api_key') {
      const llmError: LLMError = {
        code: 'AUTH_FAILED',
        message: 'OpenAI API authentication failed',
        provider: 'openai',
        originalError: error
      };
      throw llmError;
    }

    const llmError: LLMError = {
      code: 'API_ERROR',
      message: `OpenAI API error: ${error.message}`,
      provider: 'openai',
      originalError: error
    };
    throw llmError;
  }
}

/**
 * Main function to summarize text with failover logic
 */
export async function summarizeText(
  text: string, 
  customPrompt?: string
): Promise<SummarizationResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Input text is required');
  }

  // Get system prompt and API keys
  const [systemPrompt, apiKeys] = await Promise.all([
    customPrompt ? Promise.resolve(customPrompt) : getSystemPrompt(),
    loadApiKeys()
  ]);

  if (!apiKeys || apiKeys.length === 0) {
    const llmError: LLMError = {
      code: 'NO_KEYS',
      message: 'No API keys configured. Please add API keys in the settings.'
    };
    throw llmError;
  }

  const errors: LLMError[] = [];

  // Try each API key in priority order
  for (const keyConfig of apiKeys) {
    try {
      const apiKey = decryptApiKey(keyConfig.key_encrypted);
      
      console.log(`Attempting to use ${keyConfig.provider} API (priority: ${keyConfig.priority_order})`);
      
      if (keyConfig.provider === 'gemini') {
        return await callGemini(apiKey, text, systemPrompt);
      } else if (keyConfig.provider === 'openai') {
        return await callOpenAI(apiKey, text, systemPrompt);
      } else {
        console.warn(`Unknown provider: ${keyConfig.provider}`);
        continue;
      }

    } catch (error) {
      if (isLLMError(error)) {
        errors.push(error);
        console.warn(`${keyConfig.provider} API failed:`, error.message);
        
        // If it's an auth or quota error, skip to next key immediately
        if (error.code === 'AUTH_FAILED' || error.code === 'QUOTA_EXCEEDED') {
          continue;
        }
        
        // For rate limit errors, we might want to wait a bit before trying next key
        if (error.code === 'RATE_LIMIT') {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.error(`Unexpected error with ${keyConfig.provider}:`, error);
        errors.push({
          code: 'API_ERROR',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          provider: keyConfig.provider,
          originalError: error
        });
      }
    }
  }

  // All keys failed
  const allFailedError: LLMError = {
    code: 'ALL_FAILED',
    message: `All configured API keys failed. Errors: ${errors.map(e => `${e.provider}: ${e.message}`).join('; ')}`
  };
  throw allFailedError;
}

/**
 * Utility function to check if an error is an LLMError
 */
export function isLLMError(error: unknown): error is LLMError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

/**
 * Get available providers and their status
 */
export async function getProviderStatus(): Promise<{ provider: string; status: 'active' | 'inactive'; priority: number }[]> {
  try {
    const apiKeys = await loadApiKeys();
    return apiKeys.map(key => ({
      provider: key.provider,
      status: key.is_active ? 'active' : 'inactive',
      priority: key.priority_order
    }));
  } catch (error) {
    console.error('Failed to get provider status:', error);
    return [];
  }
}