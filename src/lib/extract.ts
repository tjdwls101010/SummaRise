import { YoutubeTranscript } from 'youtube-transcript';
import TurndownService from 'turndown';
import axios from 'axios';

export interface ExtractedContent {
  content: string;
  title: string;
  channel_or_site: string;
  content_type: 'youtube' | 'article';
}

export interface ExtractionError {
  code: 'NO_TRANSCRIPT' | 'FETCH_FAILED' | 'PARSE_FAILED' | 'INVALID_URL' | 'TIMEOUT';
  message: string;
  originalError?: unknown;
}

/**
 * Utility to retry async operations with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
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
 * Extract video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Extract YouTube video transcript
 */
async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Extract transcript with retry logic
    const transcript = await retryWithBackoff(async () => {
      return await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'ko,en', // Prefer Korean, fallback to English
      });
    });

    if (!transcript || transcript.length === 0) {
      const error: ExtractionError = {
        code: 'NO_TRANSCRIPT',
        message: '자막을 찾을 수 없습니다. 이 영상에는 자막이 제공되지 않거나 비공개 설정일 수 있습니다.'
      };
      throw error;
    }

    // Combine transcript segments into full text
    const fullText = transcript
      .map(segment => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract video metadata using YouTube oEmbed API
    let title = 'YouTube Video';
    let channelName = 'Unknown Channel';

    try {
      const oembedResponse = await retryWithBackoff(async () => {
        const response = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
          timeout: 10000
        });
        return response.data;
      });

      title = oembedResponse.title || title;
      channelName = oembedResponse.author_name || channelName;
    } catch (error) {
      console.warn('Failed to fetch YouTube metadata:', error);
      // Continue with default values
    }

    return {
      content: fullText,
      title,
      channel_or_site: channelName,
      content_type: 'youtube'
    };

  } catch (error: any) {
    if (error.code) {
      throw error; // Re-throw our custom errors
    }
    
    // Handle various YouTube transcript API errors
    if (error.message?.includes('Could not retrieve a transcript')) {
      const extractionError: ExtractionError = {
        code: 'NO_TRANSCRIPT',
        message: '자막을 찾을 수 없습니다. 이 영상에는 자막이 제공되지 않거나 접근할 수 없습니다.',
        originalError: error
      };
      throw extractionError;
    }
    
    const extractionError: ExtractionError = {
      code: 'FETCH_FAILED',
      message: 'YouTube 영상 처리 중 오류가 발생했습니다.',
      originalError: error
    };
    throw extractionError;
  }
}

/**
 * Extract and convert web article to Markdown
 */
async function extractArticleContent(url: string): Promise<ExtractedContent> {
  try {
    // Fetch HTML content with timeout and retry
    const response = await retryWithBackoff(async () => {
      return await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        maxRedirects: 5
      });
    });

    const html = response.data;
    if (!html || typeof html !== 'string') {
      const error: ExtractionError = {
        code: 'PARSE_FAILED',
        message: '웹페이지 내용을 가져올 수 없습니다.'
      };
      throw error;
    }

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || new URL(url).hostname;

    // Get site name from URL
    const siteName = new URL(url).hostname.replace('www.', '');

    // Configure Turndown for better Markdown conversion
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```'
    });

    // Remove unnecessary elements
    turndownService.remove(['script', 'style', 'nav', 'header', 'footer', 'aside']);
    
    // Add custom rules for better content extraction
    turndownService.addRule('removeAds', {
      filter: (node) => {
        if (node.nodeType === 1) { // Element node
          const element = node as Element;
          const classNames = element.className?.toLowerCase() || '';
          const id = element.id?.toLowerCase() || '';
          
          // Remove common ad/tracking elements
          return (
            classNames.includes('ad') ||
            classNames.includes('advertisement') ||
            classNames.includes('sidebar') ||
            classNames.includes('popup') ||
            classNames.includes('modal') ||
            id.includes('ad') ||
            id.includes('popup')
          );
        }
        return false;
      },
      replacement: () => ''
    });

    // Convert to Markdown
    const markdown = turndownService.turndown(html);
    
    // Clean up the markdown
    const cleanedMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s*\n/gm, '') // Remove empty lines at start of lines
      .trim();

    if (!cleanedMarkdown || cleanedMarkdown.length < 100) {
      const error: ExtractionError = {
        code: 'PARSE_FAILED',
        message: '웹페이지에서 충분한 텍스트 내용을 추출할 수 없습니다.'
      };
      throw error;
    }

    return {
      content: cleanedMarkdown,
      title,
      channel_or_site: siteName,
      content_type: 'article'
    };

  } catch (error: any) {
    if (error.code) {
      throw error; // Re-throw our custom errors
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const extractionError: ExtractionError = {
        code: 'TIMEOUT',
        message: '웹페이지 로딩 시간이 초과되었습니다.',
        originalError: error
      };
      throw extractionError;
    }

    if (error.response?.status >= 400) {
      const extractionError: ExtractionError = {
        code: 'FETCH_FAILED',
        message: `웹페이지에 접근할 수 없습니다 (${error.response.status}).`,
        originalError: error
      };
      throw extractionError;
    }

    const extractionError: ExtractionError = {
      code: 'FETCH_FAILED',
      message: '웹페이지 처리 중 오류가 발생했습니다.',
      originalError: error
    };
    throw extractionError;
  }
}

/**
 * Main content extraction function
 * Determines content type and extracts accordingly
 */
export async function extractContent(url: string): Promise<ExtractedContent> {
  if (!url || typeof url !== 'string') {
    const error: ExtractionError = {
      code: 'INVALID_URL',
      message: 'URL이 제공되지 않았거나 잘못된 형식입니다.'
    };
    throw error;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    const extractionError: ExtractionError = {
      code: 'INVALID_URL',
      message: 'URL 형식이 올바르지 않습니다.',
      originalError: error
    };
    throw extractionError;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Determine if it's a YouTube URL
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return await extractYouTubeContent(url);
  } else {
    return await extractArticleContent(url);
  }
}

/**
 * Utility function to check if an error is an ExtractionError
 */
export function isExtractionError(error: unknown): error is ExtractionError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}